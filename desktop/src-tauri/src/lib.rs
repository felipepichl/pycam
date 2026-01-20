use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::{broadcast, mpsc};
use tower_http::cors::CorsLayer;

// Canal de broadcast para múltiplos clientes WebSocket
type FrameChannel = Arc<broadcast::Sender<Vec<u8>>>;

// Handler WebSocket para conexões do frontend
async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(frame_tx): State<FrameChannel>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, frame_tx))
}

async fn handle_socket(socket: WebSocket, frame_tx: FrameChannel) {
    let (mut sender, mut receiver) = socket.split();

    // Criar receiver para receber frames do canal
    let mut rx = frame_tx.subscribe();

    // Canal interno para comunicação entre tasks (pong, close, etc)
    let (control_tx, mut control_rx) = mpsc::unbounded_channel::<Message>();

    // Task para enviar frames e mensagens de controle ao cliente
    let mut send_task = tokio::spawn(async move {
        loop {
            tokio::select! {
                // Receber frames do broadcast
                Ok(frame) = rx.recv() => {
                    if sender.send(Message::Binary(frame)).await.is_err() {
                        break;
                    }
                }
                // Receber mensagens de controle (pong, etc)
                Some(msg) = control_rx.recv() => {
                    if sender.send(msg).await.is_err() {
                        break;
                    }
                }
            }
        }
    });

    // Task para receber mensagens do cliente
    // Se receber mensagem binária, é um frame do mobile - fazer broadcast
    // Se receber ping, responder com pong
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => break,
                Message::Ping(data) => {
                    // Enviar pong através do canal de controle
                    if control_tx.send(Message::Pong(data)).is_err() {
                        break;
                    }
                }
                Message::Binary(frame_data) => {
                    // Frame recebido do mobile - fazer broadcast para todos os clientes
                    let _ = frame_tx.send(frame_data);
                }
                _ => {}
            }
        }
    });

    // Aguardar uma das tasks terminar
    tokio::select! {
        _ = (&mut send_task) => {
            recv_task.abort();
        }
        _ = (&mut recv_task) => {
            send_task.abort();
        }
    }
}

// Endpoint POST /frame para receber frames do mobile
async fn receive_frame(
    State(frame_tx): State<FrameChannel>,
    body: axum::body::Bytes,
) -> impl IntoResponse {
    // Converter body para Vec<u8>
    let frame = body.to_vec();

    // Broadcast frame para todos os clientes WebSocket conectados
    let _ = frame_tx.send(frame);

    // Retornar resposta de sucesso
    (StatusCode::OK, r#"{"status":"ok"}"#)
}

// Criar servidor HTTP com WebSocket
async fn start_streaming_server(frame_tx: FrameChannel) {
    // Configurar CORS para permitir conexões do mobile
    let cors = CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods(tower_http::cors::Any)
        .allow_headers(tower_http::cors::Any);

    // Criar router
    let app = Router::new()
        .route("/ws", get(websocket_handler))
        .route("/frame", post(receive_frame))
        .layer(cors)
        .with_state(frame_tx);

    // Iniciar servidor na porta 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind server");

    println!("🚀 Streaming server started on http://0.0.0.0:3000");

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
    // Criar canal de broadcast com buffer de 100 frames
    let (frame_tx, _) = broadcast::channel::<Vec<u8>>(100);
    let frame_tx = Arc::new(frame_tx);

    // Criar runtime Tokio para o servidor
    let server_tx = frame_tx.clone();
    std::thread::spawn(move || {
        // Criar runtime Tokio dedicado para o servidor
        let rt = tokio::runtime::Runtime::new()
            .expect("Failed to create Tokio runtime");
        
        // Iniciar servidor no runtime
        rt.block_on(async {
            start_streaming_server(server_tx).await;
        });
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_local_ip])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
