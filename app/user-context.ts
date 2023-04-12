import type { AmplifyUser } from "@aws-amplify/ui";

import { createContext } from "react";

export const UserContext = createContext<{
  user?: AmplifyUser;
  signOut?: () => void;
}>({});
