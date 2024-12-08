export default function QuickStart(props: { authenticate: () => void }) {
  return (
    <button className="settings-button" onClick={props.authenticate}>
      Log in with Apple Music
    </button>
  );
}
