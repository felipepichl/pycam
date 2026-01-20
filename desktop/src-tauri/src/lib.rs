// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::CorsLayer;

// Mensagens de signaling WebRTC
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SignalingMessage {
    #[serde(rename = "offer")]
    Offer { sdp: String },
    #[serde(rename = "answer")]
    Answer { sdp: String },
    #[serde(rename = "ice-candidate")]
    IceCandidate { candidate: serde_json::Value },
}

// Estado compartilhado para signaling
#[derive(Clone)]
struct SignalingState {
    // Mensagens do mobile (offer, ICE candidates)
    mobile_messages: Arc<Mutex<Vec<SignalingMessage>>>,
    // Mensagens do desktop (answer, ICE candidates)
    desktop_messages: Arc<Mutex<Vec<SignalingMessage>>>,
}

// Endpoint para mobile enviar mensagens (offer, ICE candidates)
async fn mobile_send(
    State(state): State<SignalingState>,
    Json(message): Json<SignalingMessage>,
) -> impl IntoResponse {
    println!("📥 Mobile sent: {:?}", message);
    let mut messages = state.mobile_messages.lock().await;
    messages.push(message);
    println!("📦 Total mobile messages: {}", messages.len());
    (StatusCode::OK, Json(serde_json::json!({"status": "ok"})))
}

// Endpoint para mobile receber mensagens (answer, ICE candidates)
async fn mobile_receive(State(state): State<SignalingState>) -> impl IntoResponse {
    let mut messages = state.desktop_messages.lock().await;
    if messages.is_empty() {
        return (StatusCode::OK, Json(serde_json::json!([]))).into_response();
    }
    let response: Vec<SignalingMessage> = messages.drain(..).collect();
    (StatusCode::OK, Json(response)).into_response()
}

// Endpoint para desktop enviar mensagens (answer, ICE candidates)
async fn desktop_send(
    State(state): State<SignalingState>,
    Json(message): Json<SignalingMessage>,
) -> impl IntoResponse {
    let mut messages = state.desktop_messages.lock().await;
    messages.push(message);
    (StatusCode::OK, Json(serde_json::json!({"status": "ok"})))
}

// Endpoint para desktop receber mensagens (offer, ICE candidates)
async fn desktop_receive(State(state): State<SignalingState>) -> impl IntoResponse {
    let mut messages = state.mobile_messages.lock().await;
    if messages.is_empty() {
        return (StatusCode::OK, Json(serde_json::json!([]))).into_response();
    }
    println!("📤 Desktop receiving {} message(s)", messages.len());
    let response: Vec<SignalingMessage> = messages.drain(..).collect();
    (StatusCode::OK, Json(response)).into_response()
}

// Criar servidor HTTP para signaling
async fn start_signaling_server(state: SignalingState) {
    let cors = CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods(tower_http::cors::Any)
        .allow_headers(tower_http::cors::Any);

    let app = Router::new()
        .route("/mobile/send", post(mobile_send))
        .route("/mobile/receive", get(mobile_receive))
        .route("/desktop/send", post(desktop_send))
        .route("/desktop/receive", get(desktop_receive))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind server");

    println!("🚀 HTTP Signaling server started on http://0.0.0.0:3000");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}

// Comando Tauri para obter IP local
#[tauri::command]
async fn get_local_ip() -> Result<String, String> {
    local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .map_err(|e| format!("Failed to get local IP: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Criar estado compartilhado
    let state = SignalingState {
        mobile_messages: Arc::new(Mutex::new(Vec::new())),
        desktop_messages: Arc::new(Mutex::new(Vec::new())),
    };

    // Iniciar servidor HTTP em thread separada
    let server_state = state.clone();
    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new()
            .expect("Failed to create Tokio runtime");
        rt.block_on(async {
            start_signaling_server(server_state).await;
        });
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_local_ip])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
