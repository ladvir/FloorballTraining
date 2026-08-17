namespace FloorballTraining.API.IntegrationTests;

// All integration tests share ONE host/factory and run sequentially. The API configures a
// static Serilog bootstrap logger (Log.Logger), so building several hosts in parallel races
// on it ("The logger is already frozen"). A single collection fixture avoids that and keeps
// the in-memory SQLite database shared across tests.
[CollectionDefinition("Api")]
public class ApiCollection : ICollectionFixture<CustomWebApplicationFactory>
{
}
