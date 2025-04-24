import { AppHeader } from "../components/app-header";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import OrderBook from "./components/orderbook";


export default function Page() {
  const queryClient = new QueryClient();

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="p-4">
          <OrderBook />
        </div>
      </HydrationBoundary>
    </div>
  );
}