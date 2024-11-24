export default function QuickStart(props: { authenticate: () => void }) {
  return <button onClick={props.authenticate}>Log in with Spotify</button>;
}
