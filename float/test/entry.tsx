import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { withPhysics } from "../withPhysics"

/** Stand-in for whatever Framer component the override wraps. */
const Hero = () => <div style={{ width: "100%", height: "100%" }} />
const Wrapped = withPhysics(Hero)

const root = createRoot(document.getElementById("root")!)
root.render(
    <StrictMode>
        <Wrapped />
    </StrictMode>
)
;(window as any).__unmount = () => root.unmount()
