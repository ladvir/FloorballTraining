namespace FloorballTraining.CoreBusiness
{
    public class ApplicationClaim
    {
        public string Type { get; set; }
        public string Value { get; set; }
    }

    public class ApplicationAuthenticationState
    {
        public bool IsAuthenticated { get; set; }
        public string Name { get; set; }
        public IEnumerable<ApplicationClaim> Claims { get; set; }
    }
}