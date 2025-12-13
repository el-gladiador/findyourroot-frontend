export default function Loading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
