import LoginButton from "@/components/LoginLogoutButton";
import UserGreetText from "@/components/UserGreetText";

export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="flex justify-between items-center mb-8">
        <UserGreetText />
        <LoginButton />
      </div>
      <div className="flex-1">
        <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
        {/* Add your dashboard content here */}
      </div>
    </main>
  );
} 