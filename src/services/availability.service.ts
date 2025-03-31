import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import { ITutorAvailability } from "../interfaces/availability.interface";
import { IdParam } from "../interfaces/helper.interface";
import TutorAvailability from "../models/Availability";
import User from "../models/User";
import moment from "moment-timezone";

const generate30MinSlots = (
  date: string,
  start: string,
  end: string,
  timezone: string,
) => {
  const slots = [];
  let currentTime = moment.tz(`${date} ${start}`, "YYYY-MM-DD HH:mm", timezone);
  const endTime = moment.tz(`${date} ${end}`, "YYYY-MM-DD HH:mm", timezone);

  while (currentTime.isBefore(endTime)) {
    const slotEnd = currentTime.clone().add(30, "minutes");

    if (slotEnd.isAfter(endTime)) break;

    slots.push({
      dateStart: currentTime.toISOString(),
      dateEnd: slotEnd.toISOString(),
      status: "free",
    });

    currentTime = slotEnd;
  }

  return slots;
};

export const createTutorAvailabilityService = async (
  data: ITutorAvailability,
) => {
  const { tutorId, weeklyAvailability, timezone } = data;

  const user = await User.findById(tutorId);
  if (!user) {
    throw new ApiError(404, "Tutor not found");
  }

  if (user?.role !== "tutor") {
    throw new ApiError(400, "User must be a tutor to set availability");
  }

  // Get the current date and generate 30-minute slots for the next month
  const startDate = moment().startOf("day");
  const endDate = moment().add(1, "month").endOf("day");

  let timesForBooking: any[] = [];

  for (
    let date = startDate.clone();
    date.isBefore(endDate);
    date.add(1, "day")
  ) {
    const dayOfWeek = date.format("dddd"); // "Monday", "Tuesday", etc.

    // Fix: Allow indexing safely
    const availability =
      (weeklyAvailability as Record<string, { start: string; end: string }[]>)[
        dayOfWeek
      ] || [];

    if (availability.length > 0) {
      availability.forEach(({ start, end }) => {
        timesForBooking.push(
          ...generate30MinSlots(
            date.format("YYYY-MM-DD"),
            start,
            end,
            timezone,
          ),
        );
      });
    }
  }

  // Create and store availability
  const availability = await TutorAvailability.create({
    tutorId,
    timezone,
    weeklyAvailability,
    timesForBooking,
  });

  return availability;
};

export const getTutorAvailabilityService = async (params: IdParam) => {
  const availability = await TutorAvailability.findOne({ tutorId: params.id });
  if (!availability) {
    throw new ApiError(400, `Availability not found`);
  }
  return new ApiResponse(200, "Availability Found", availability);
};

export const updateTutorAvailabilityService = async (
  tutorId: string,
  updatedData: Partial<ITutorAvailability>,
) => {
  const { weeklyAvailability: newAvailability, timezone } = updatedData;

  const tutor = await User.findById(tutorId);
  if (!tutor) {
    throw new ApiError(404, "Tutor not found");
  }

  if (tutor?.role !== "tutor") {
    throw new ApiError(400, "User must be a tutor to set availability");
  }

  // Fetch existing availability
  const existingAvailability = await TutorAvailability.findOne({ tutorId });

  if (!existingAvailability) {
    throw new ApiError(404, "Availability not found. Create it first.");
  }

  // Merge old and new availability
  const mergedAvailability: Record<string, { start: string; end: string }[]> = {
    ...(existingAvailability.weeklyAvailability || {}),
  };

  // Replace only the provided days in newAvailability
  for (const day in newAvailability) {
    mergedAvailability[day] = newAvailability[day] || []; // Ensure it's always an array
  }

  // Get the current date and generate 30-minute slots for the next month
  const startDate = moment().startOf("day");
  const endDate = moment().add(1, "month").endOf("day");

  let timesForBooking: any[] = [];

  for (
    let date = startDate.clone();
    date.isBefore(endDate);
    date.add(1, "day")
  ) {
    const dayOfWeek = date.format("dddd"); // "Monday", "Tuesday", etc.

    // Use updated availability
    const availability =
      (mergedAvailability as Record<string, { start: string; end: string }[]>)[
        dayOfWeek
      ] || [];

    if (availability.length > 0) {
      availability.forEach(({ start, end }) => {
        timesForBooking.push(
          ...generate30MinSlots(
            date.format("YYYY-MM-DD"),
            start,
            end,
            timezone as string,
          ),
        );
      });
    }
  }

  // Update tutor availability in the database
  existingAvailability.weeklyAvailability = mergedAvailability;
  existingAvailability.timesForBooking = timesForBooking;
  if (timezone) existingAvailability.timezone = timezone; // Update timezone if provided

  await existingAvailability.save();

  return existingAvailability;
};
