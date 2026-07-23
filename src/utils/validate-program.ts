import { PROGRAM_TYPE} from "@/src/constants/program";

export function validateProgram(data: any) {
  // Program Name
  if (!data.program_name) {
    throw new Error("Program name is required");
  }

  // Repeat Count
  if (data.repeat_count == null) {
    throw new Error("Repeat count is required");
  }

  if (data.repeat_count <= 0) {
    throw new Error("Repeat count must be greater than 0");
  }

  // Session Per Day
  if (data.session_per_day == null) {
    throw new Error("Session per day is required");
  }

  if (data.session_per_day <= 0) {
    throw new Error("Session per day must be greater than 0");
  }

  // Duration
  if (data.duration_sec == null) {
    throw new Error("Duration is required");
  }

  if (data.duration_sec <= 0) {
    throw new Error("Duration must be greater than 0");
  }

  // Program Type
  if (!data.program_type) {
    throw new Error("Program type is required");
  }

  if (
    data.program_type !== PROGRAM_TYPE.SYSTEM &&
    data.program_type !== PROGRAM_TYPE.CUSTOM
  ) {
    throw new Error("Invalid program type");
  }

  // Created By
  if (data.program_type === PROGRAM_TYPE.CUSTOM && !data.created_by) {
    throw new Error("Created by is required for custom program");
  }
}
