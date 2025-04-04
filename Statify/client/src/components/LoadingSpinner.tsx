import { Card, CardContent } from "@/components/ui/card";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="text-center p-4">
      <div className="loading-spinner inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4 animate-spin"></div>
      <p className="text-white">{message}</p>
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background bg-opacity-80 z-50">
        {spinner}
      </div>
    );
  }
  
  return (
    <Card className="p-6 text-center flex items-center justify-center min-h-[200px]">
      <CardContent>{spinner}</CardContent>
    </Card>
  );
}
