// Import React and ReactDOM from window object
const { useState, useEffect } = React;
const { near } = window;

const contractId = "berryclub.ek.near";

const BoardHeight = 50;
const DefaultBalance = 25;

const lines = [];
for (let i = 0; i < BoardHeight; ++i) {
  lines.push(i);
}

const intToColor = (c) => `#${c.toString(16).padStart(6, "0")}`;

const decodeLine = (line) => {
  let buf = Buffer.from(line, "base64");
  let pixels = [];
  for (let i = 4; i < buf.length; i += 8) {
    let color = buf.readUInt32LE(i);
    pixels.push(
      <div
        className="cell"
        key={i}
        style={{ backgroundColor: intToColor(color) }}
      />,
    );
  }
  return pixels;
};

// Simple Counter Component
function Counter() {
  const [nonce, setNonce] = useState(0);
  const [totalSupply, setTotalSupply] = useState("");
  const [berryAccount, setBerryAccount] = useState(null);
  const [encodedLines, setEncodedLines] = useState([]);
  useEffect(() => {
    near.onAccount(() => {
      setNonce((nonce) => nonce + 1);
    });
    near.onTx(() => {
      setNonce((nonce) => nonce + 1);
    });
  }, []);

  useEffect(() => {
    (async () => {
      setTotalSupply(
        await near.view({
          contractId,
          methodName: "ft_total_supply",
          args: {},
        }),
      );
      setBerryAccount(
        near.accountId
          ? await near.view({
              contractId,
              methodName: "get_account",
              args: {
                account_id: near.accountId,
              },
            })
          : null,
      );
      // loading board
      setEncodedLines(
        await near.view({
          contractId,
          methodName: "get_lines",
          args: {
            lines,
          },
        }),
      );
    })();
  }, [nonce]);

  return (
    <div className="container-fluid">
      {near.accountId ? (
        <div key="sign-out">
          <h1>Logged in as {near.accountId}</h1>
          <div>Pubkey is {near.publicKey}</div>
          <div>
            Auth:
            <br />
            <pre>{JSON.stringify(near.authStatus, null, 2)}</pre>
          </div>
          <button
            className="btn btn-secondary m-1"
            onClick={() => near.signOut()}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div key="sign-in">
          <button
            className="btn btn-primary m-1"
            onClick={() => near.requestSignIn({ contractId })}
          >
            Sign In
          </button>
        </div>
      )}
      <div>
        Total Supply: {totalSupply ? parseFloat(totalSupply) / 1e18 : ""}
      </div>
      {near.accountId && (
        <div>
          Your Balance:{" "}
          {berryAccount
            ? parseFloat(berryAccount.avocado_balance) / 1e18
            : DefaultBalance}
        </div>
      )}
      <div
        className="mw-100 d-flex align-items-stretch flex-column align-content-stretch"
        style={{ maxHeight: "420px", aspectRatio: "1 / 1" }}
      >
        {encodedLines.map((line, i) => (
          <div key={i} className="line">
            {decodeLine(line)}
          </div>
        ))}
      </div>

      <button
        className="btn btn-success m-1"
        onClick={() =>
          near.sendTx({
            receiverId: contractId,
            actions: [
              near.actions.functionCall({
                methodName: "draw",
                gas: $$`100 Tgas`,
                deposit: "0",
                args: {
                  pixels: [
                    {
                      x: 0,
                      y: 0,
                      color: 255 << 8, // green
                    },
                  ],
                },
              }),
            ],
          })
        }
      >
        Draw left top pixel green
      </button>
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Counter />);
