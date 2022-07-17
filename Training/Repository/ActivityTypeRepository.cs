using Domain;
using System.Collections.Generic;

namespace Repository
{
    public class ActivityTypeRepository
    {
        private readonly string _connectionString;

        public ActivityTypeRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public IEnumerable<ActivityType> GetAllActivityTypes()
        {

            return QueryHelper<ActivityType>.Query("dbo.ActivityType_GETALL", _connectionString);
        }

        public IEnumerable<ActivityType> GetActivityTypesByName(string name)
        {
            return QueryHelper<ActivityType>.Query("dbo.ActivityType_GetByName @Name", new { Name = name }, _connectionString);
        }

        public void Insert(string name)
        {
            QueryHelper<ActivityType>.Execute("dbo.ActivityType_Insert @Name", new { Name = name }, _connectionString);
        }

        public void Update(int id, string newName)
        {
            QueryHelper<ActivityType>.Execute("dbo.ActivityType_Update @Id, @NewName", new { Id = id, NewName = newName }, _connectionString);
        }

        public void Delete(int id)
        {
            QueryHelper<ActivityType>.Execute("dbo.ActivityType_Delete @Id", new { Id = id }, _connectionString);
        }
    }
}
