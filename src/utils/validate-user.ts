export function validateUser(data: any) {
  if (!data.role_id) {
    throw new Error("Role is required");
  }

  if (!data.username) {
    throw new Error("Username is required");
  }

  if (!data.password) {
    throw new Error("Password is required");
  }

  if (!data.first_name) {
    throw new Error("First name is required");
  }

  if (!data.last_name) {
    throw new Error("Last name is required");
  }

  // Patient
  if (data.role_id === "R001") {
    if (!data.medical_condition) {
      throw new Error("Medical condition is required");
    }

    if (!data.weight) {
      throw new Error("Weight is required");
    }
  }

  // Occupational Therapist
  if (data.role_id === "R002") {
    if (!data.license_number) {
      throw new Error("License number is required");
    }
  }

  // Invalid Role
  if (
    data.role_id !== "R001" &&
    data.role_id !== "R002" &&
    data.role_id !== "R003"
  ) {
    throw new Error("Invalid role");
  }
}
