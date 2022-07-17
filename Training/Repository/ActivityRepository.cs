using Domain;
using System.Collections.Generic;

namespace Repository
{
    public class ActivityRepository
    {
        private readonly string _connectionString;

        public ActivityRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public IEnumerable<Activity> GetAllActivities()
        {

            return QueryHelper<Activity>.Query("dbo.Activity_GetAll", _connectionString);
        }

        public IEnumerable<Activity> GetActivitiesByName(string name)
        {
            return QueryHelper<Activity>.Query("dbo.Activity_GetByName @Name", new { Name = name }, _connectionString);
        }

        public void Insert(string name)
        {
            QueryHelper<Activity>.Execute("dbo.Activity_Insert @Name", new { Name = name }, _connectionString);
        }

        public void Update(int id, string newName)
        {
            QueryHelper<Activity>.Execute("dbo.Activity_Update @Id, @NewName", new { Id = id, NewName = newName }, _connectionString);
        }

        public void Delete(int id)
        {
            QueryHelper<Activity>.Execute("dbo.Activity_Delete @Id", new { Id = id }, _connectionString);
        }
    }
}
