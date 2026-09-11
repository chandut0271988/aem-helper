import { render } from "preact";
import { App } from "./app/App";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/forms.css";

render(<App />, document.getElementById("app")!);
