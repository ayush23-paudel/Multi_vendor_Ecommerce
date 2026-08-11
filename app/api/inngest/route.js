
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import {
  deleteCouponExpiry,
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  handleOrderTimeout,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    deleteCouponExpiry,
    handleOrderTimeout
  ],
});
