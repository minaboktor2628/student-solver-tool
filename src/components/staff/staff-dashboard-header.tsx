type HeaderProps = {
  username: string | null | undefined;
};

export const Header: React.FC<HeaderProps> = ({ username }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">Staff Dashboard</h1>
      <p className="text-muted-foreground mt-2">Welcome back, {username}</p>
    </div>
  );
};
