export function Spinner({ size = 18 }: { size?: number }) {
  return <div className="spinner spin" style={{ width: size, height: size }} />;
}
