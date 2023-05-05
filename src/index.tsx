import { Todos } from "~/app/components/Todos";

import ReactDOM from "react-dom/client";
import { DatabaseBootstrap } from "~/app/db";

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <DatabaseBootstrap>
    <Todos />
  </DatabaseBootstrap>
);
