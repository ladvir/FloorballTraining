using Domain;
using System.Collections.Generic;

namespace Repository
{
    public class AimRepository
    {
        private readonly string _connectionString;

        public AimRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public IEnumerable<Aim> GetAllAims()
        {

            return QueryHelper<Aim>.Query("dbo.Aim_GETALL", _connectionString);
        }

        public IEnumerable<Aim> GetAimsByName(string name)
        {
            return QueryHelper<Aim>.Query("dbo.Aim_GetByName @Name", new { Name = name }, _connectionString);
        }

        public void Insert(string name)
        {
            QueryHelper<Aim>.Execute("dbo.Aim_Insert @Name", new { Name = name }, _connectionString);
        }

        public void Update(int id, string newName)
        {
            QueryHelper<Aim>.Execute("dbo.Aim_Update @Id, @NewName", new { Id = id, NewName = newName }, _connectionString);
        }

        public void Delete(int id)
        {
            QueryHelper<Aim>.Execute("dbo.Aim_Delete @Id", new { Id = id }, _connectionString);
        }
    }
}
