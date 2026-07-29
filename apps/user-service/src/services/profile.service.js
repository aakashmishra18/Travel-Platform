const { withTransaction } = require("../config/db");
const ProfileRepository = require("../repositories/profile.repository");
const TravellerRepository = require("../repositories/traveller.repository");
const ApiError = require("../utils/ApiError");

function toPublicProfile(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    phone: row.phone,
    profileImageUrl: row.profile_image_url,
    profileStatus: row.profile_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ProfileService = {
  async getProfile(userId) {
    const row = await ProfileRepository.findByUserId(userId);
    // A user with no profile row yet (never saved anything) is not an
    // error — return an empty-shaped profile rather than 404, since
    // "no profile data yet" is a normal, expected state right after signup.
    return toPublicProfile(row) || { userId, profileStatus: "ACTIVE" };
  },

  async updateProfile(userId, fields) {
    const row = await ProfileRepository.upsert(null, userId, fields);
    return toPublicProfile(row);
  },

  /**
   * Ensures a SELF traveller entry exists/matches the profile, so the
   * user themselves shows up in their own traveller list without
   * re-entering their name/DOB when booking for "myself".
   */
  async syncSelfTraveller(userId) {
    return withTransaction(async (client) => {
      const travellers = await TravellerRepository.listByUser(userId);
      const self = travellers.find((t) => t.relationship === "SELF");
      const profile = await ProfileRepository.findByUserId(userId);
      if (!profile) throw ApiError.badRequest("Complete your profile before syncing traveller info");

      if (self) {
        return TravellerRepository.update(client, self.id, {
          firstName: profile.first_name,
          lastName: profile.last_name,
          dateOfBirth: profile.date_of_birth,
          gender: profile.gender,
        });
      }
      return TravellerRepository.create(client, userId, {
        type: "ADULT",
        relationship: "SELF",
        firstName: profile.first_name || "Unknown",
        lastName: profile.last_name || "",
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
      });
    });
  },

  /**
   * Starts the deletion workflow: marks the profile PENDING_DELETION
   * immediately (so it can be excluded from active-user views right
   * away), then anonymizes PII. Full row deletion is deliberately not
   * performed here — bookings/orders elsewhere may still reference this
   * user_id, so scrubbing PII in place preserves referential history
   * without retaining identifying data.
   */
  async requestDeletion(userId) {
    return withTransaction(async (client) => {
      await ProfileRepository.setStatus(client, userId, "PENDING_DELETION");
      await ProfileRepository.anonymize(client, userId);
      return { userId, profileStatus: "ANONYMIZED" };
    });
  },
};

module.exports = ProfileService;
