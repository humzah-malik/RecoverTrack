// src/pages/Profile.tsx
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/users"; // assumes you already have a function to fetch /users/me
import { Link } from "react-router-dom";

export default function Profile() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError || !user) return <div className="p-6 text-red-600">Failed to load user info.</div>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-4">Your Profile</h1>

      {/* Basic Info */}
      <Section title="Basic Info">
        <InfoRow label="First Name" value={user.first_name} />
        <InfoRow label="Last Name" value={user.last_name}/>
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Age" value={user.age} />
        <InfoRow label="Sex" value={user.sex} />
        <InfoRow label="Height" value={user.height} />
        <InfoRow label="Height Unit" value={user.height_unit} />
        <InfoRow label="Weight" value={user.weight} />
        <InfoRow label="Weight Unit" value={user.weight_unit} />
      </Section>

      {/* Goals */}
      <Section title="Goals">
        <InfoRow label="Goal" value={user.goal} />
        <InfoRow label="Maintenance Calories" value={user.maintenance_calories} />
        <InfoRow
          label="Macro Targets"
          value={
            user.macro_targets
              ? `Protein: ${user.macro_targets.protein}, Carbs: ${user.macro_targets.carbs}, Fat: ${user.macro_targets.fat}`
              : "Not set"
          }
        />
      </Section>

      {/* Buttons */}
      <div className="space-x-4 pt-4">
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Reset Account
        </button>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b py-1">
      <span className="font-medium">{label}</span>
      <span className="text-gray-700">{value ?? "Not set"}</span>
    </div>
  );
}