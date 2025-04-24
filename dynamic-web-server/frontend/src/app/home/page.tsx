import { AppHeader } from "../components/app-header";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import Home from "./components/home";


export default function Page() {
  const queryClient = new QueryClient();

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="p-4">
          <Home />
        </div>
      </HydrationBoundary>
    </div>
  );
}