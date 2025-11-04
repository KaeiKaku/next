import { Modal, Button, Flex } from "antd";
import style from "./sessionModal.module.css";

export default function SessionModal({
  visible,
  onConfirm,
  title = "利用上の注意",
}) {
  return (
    <Modal
      centered
      width="40%"
      open={visible}
      title={title}
      closable={false}
      maskClosable={false}
      footer={[
        <Button key="ok" type="primary" onClick={onConfirm}>
          <b>上記を理解して利用する</b>
        </Button>,
      ]}
    >
      <Flex
        style={{
          padding: "1rem",
        }}
      >
        <ul>
          <li>
            生成AIはプロンプトの入れ方により、表示される回答の精度が異なります。単語のみではなく、文章を入力してください。
            <p>例：×「EY新日本」</p>
            <p>〇「EY新日本を紹介してください。」</p>
          </li>
          <li>
            当サービスは、以下の関連のドキュメントに対して、<b>Azure OpenAI</b>
            を利用した自動応答を提供するサービス（開発版）です。あらかじめ用意されたドキュメントに対して質問を投げかけ、回答を得ることができます。複数のドキュメントを横断的に検索し、情報を整理することも可能です。
          </li>
          <li>
            <b
              style={{
                color: "red",
              }}
            >
              クライアントの機密情報や個人情報などの入力は禁止します。
            </b>
          </li>
          <li>
            回答には正確性に欠ける場合があるため、回答を疑問視し、内容を慎重に検討した上で、自己判断に基づいてご利用ください。
          </li>
          <li>入力された内容は機能向上のためにログを取得します。</li>
          <li style={{ marginTop: "1rem" }}>
            <b>ご利用流れ</b>
          </li>
          <ul
            style={{
              paddingLeft: "1rem",
            }}
          >
            <li>左のDocument Collectionを選択</li>
            <li>
              Selection
              Queryを検索すると対象Collectionのファイル類似度を計算されます
            </li>
            <li>Similarityやフォルダツリーに適当なファイルを選択</li>
            <li>下の会話枠に質問を投げてAIが答えてくれます</li>
          </ul>
        </ul>
      </Flex>
    </Modal>
  );
}
