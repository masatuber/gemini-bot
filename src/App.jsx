import './GeminiApp.css';
import { useState } from 'react';
import { createTheme, ThemeProvider, Paper, CssBaseline, Button, Stack, Snackbar, Link } from "@mui/material";
import Divider from '@mui/material/Divider';
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SendIcon from "@mui/icons-material/Send";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import axios from "axios";
//https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=AIzaSyBQC9-rWXHJP_pM7xvnhKQag7ik0uZQ5Ek
// https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-001:generateContent?key=AIzaSyBQC9-rWXHJP_pM7xvnhKQag7ik0uZQ5Ek
//models/gemini-2.5-flash
//  https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=AIzaSyBQC9-rWXHJP_pM7xvnhKQag7ik0uZQ5Ek
// https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key
const App = () => {
  //API関連2.5プレビュー版に更新
  const API_KEY = import.meta.env.VITE_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${API_KEY}`;

  const [messages, setMessages] = useState([]); // メッセージ履歴
  const [input, setInput] = useState(""); // ユーザー入力
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(""); // ストリーミング表示用のテキスト
  const [darkMode, setDarkMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false); // コピー成功時に Snackbar 表示用
  //ダークモード定義
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      background: {
        default: darkMode ? "#333333" : "#ffffff",
        paper: darkMode ? "#333333" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#ffffff" : "#292929",
      },
    },
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    // ユーザーのメッセージを追加
    const newMessage = { role: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");
    setLoading(true);
    setBotTyping(""); // ボットの回答を初期化

    try {
      
      const response = await axios.post(API_URL, {
        // 必須：プロンプト（role＋parts の配列）
        contents: [
          {
            role: 'user',
            parts: [{ text: input }],
          },
        ],
        // ─────────────────────────────────────────────
        // 任意：生成時の詳細パラメータ
        // ─────────────────────────────────────────────
        //temperature: 0.7,        // 0.0～1.0
        //candidateCount: 1,       // 何件候補を生成するか
        //topP: 0.9,               // nucleus sampling
       // stopSequences: ['\n'],   // ここで改行で止める例
        // safetySettings: [        // 不要なら省略可
        //   {
        //     category: 'CATEGORY_DEROGATORY',
        //     threshold: 'BLOCKING',
        //   },
        //   // 他のカテゴリも設定可能
        // ],
    
      });
      //API通信中は回答生成中を表示する
      setLoading(false);
      const replyText =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "エラー: 返信を取得できませんでした。";

      // ストリーミング風に文字を一文字ずつ表示
      let index = 0;
      const interval = setInterval(() => {
        if (index < replyText.length) {
          setBotTyping((prev) => prev + replyText[index]); // 一文字ずつ追加
          index++;
        } else {
          clearInterval(interval); // 全文が表示されたら停止
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: "bot", text: replyText },
          ]);
          setBotTyping(""); // 最後に botTyping をクリア
        }
      }, 15); // 15msごとに1文字表示
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "bot", text: "エラー: APIリクエストに失敗しました。" },
      ]);
      //  } finally {
      
    }
  };

  // 最新の回答テキストをクリップボードにコピーする関数を追加
  const copyAnswerToClipboard = () => {
    // 最新の bot のメッセージを取得
    const lastBotMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "bot");
    if (lastBotMessage && lastBotMessage.text) {
      // Clipboard API を使用してテキストをコピー
      navigator.clipboard
        .writeText(lastBotMessage.text)
        .then(() => {
          // コピー成功時に Snackbar を表示
          setCopySuccess(true);
        })
        .catch((err) => {
          console.error("クリップボードへのコピーに失敗しました:", err);
        });
    } else {
      console.warn("コピーする回答テキストがありません。");
    }
  };

  // Snackbar の閉じる処理
  const handleSnackbarClose = () => {
    setCopySuccess(false);
  };

  return (
    <div>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Paper style={{ minHeight: "100vh", padding: "5px" }} elevation={1}>
          {loading ? (
            <div className="answerText">回答生成中...</div>
          ) : (
            <p>gemini2.5-proに聞きたい事はございませんか？</p>
          )}
          <DarkModeIcon
            onClick={() => setDarkMode((prevMode) => !prevMode)}
            style={{ cursor: "pointer" }}
          />
          <div
            style={{
              height: "450px",
              overflowY: "clip",
              border: "2px solid #d76868",
              padding: "5px",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{ textAlign: msg.role === "user" ? "right" : "left" }}
              >
                <strong>
                  {msg.role === "user" ? "ユーザー質問" : "AI回答"}:
                </strong>{" "}
                <Divider />
                {msg.text}
              </div>
            ))}
            {/* ストリーミング中のテキスト表示 */}
            {botTyping && (
              <div style={{ textAlign: "left", fontStyle: "italic" }}>
                <br />
                <Divider />
                <strong>AIの回答:</strong> {botTyping}
              </div>
            )}
          </div>
          <div style={{ marginTop: "9px" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="質問を入力"
              style={{ width: "80%", padding: "5px" }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                onClick={sendMessage}
                variant="contained"
                color="success"
                endIcon={<SendIcon />}
              >
                プロンプト送信
              </Button>
              {/* 回答テキストをクリップボードにコピーするボタンを追加 */}
              <Button
                onClick={copyAnswerToClipboard}
                variant="outlined"
                color="primary"
                startIcon={<CopyAllIcon />}
              >
                回答をコピー
              </Button>
            </Stack>
            {/* Snackbar コンポーネント: コピー成功時の通知 */}
            <Snackbar
              open={copySuccess}
              autoHideDuration={3000}
              onClose={handleSnackbarClose}
              message="回答がクリップボードにコピーされました"
            />
          </div>
          <div className="linkCss">
            <Link
              href="https://openai.com/ja-JP/chatgpt/overview/"
              target="_blank"
              underline="none"
              color="secondary"
            >
              Chat GPTのリンクはこちら
            </Link>
            <br />
            <Link
              href="https://prompt.quel.jp/"
              target="_blank"
              underline="none"
              color="secondary"
            >
              プロンプト集のリンクはこちら
            </Link>
            <br />
            <Link href="mailto:" underline="none" color="inherit">
              メールソフト起動(宛先なし)
            </Link>
          </div>
        </Paper>
      </ThemeProvider>
    </div>
  );
};

export default App;