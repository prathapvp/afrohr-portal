import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
    const navigate=useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.2),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_36%),linear-gradient(180deg,#060910_0%,#0b1220_58%,#05080f_100%)] px-4">
      <div className="max-w-md rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(2,6,23,0.96))] p-8 text-center shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
        <h1 className="mb-4 text-5xl font-black text-red-400">403</h1>
        <h2 className="mb-4 text-2xl font-semibold text-bright-sun-300">Unauthorized Access</h2>
        <p className="mb-6 text-mine-shaft-200">
          Sorry, you don’t have permission to view this page.
        </p>
        <Button color="brightSun.4" variant="gradient" gradient={{ from: "brightSun.5", to: "orange.6", deg: 90 }} className="font-semibold text-mine-shaft-950" onClick={()=>navigate('/')}>
          Go to Homepage
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
