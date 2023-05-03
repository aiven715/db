import { Todos } from "~/components/Todos";

import ReactDOM from "react-dom/client";
import { DatabaseProvider } from "~/db";

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <DatabaseProvider>
    <Todos />
  </DatabaseProvider>
);
