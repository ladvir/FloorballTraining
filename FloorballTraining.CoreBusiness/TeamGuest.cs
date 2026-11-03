namespace FloorballTraining.CoreBusiness
{
    /// <summary>
    /// Read-only guest access to a team. The guest is a plain login (<see cref="AppUserId"/>) with
    /// no <see cref="Member"/> card, so never a player. One guest can follow several teams.
    /// </summary>
    public class TeamGuest : BaseEntity
    {
        public int TeamId { get; set; }
        public Team? Team { get; set; }

        public string AppUserId { get; set; } = string.Empty;

        public string? CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
