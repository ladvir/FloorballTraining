namespace FloorballTraining.API.Dtos.Auth
{
    /// <summary>
    /// Optional body for native clients that cannot rely on the httpOnly refresh cookie
    /// (see <see cref="RefreshRequest"/> and AuthController's Origin-header gating).
    /// </summary>
    public class LogoutRequest
    {
        public string? RefreshToken { get; set; }
    }
}
