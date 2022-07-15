using Domain;
using System.Collections.Generic;

namespace Repository
{
    public class AccessoryRepository


    {

        private readonly string _connectionString;

        public AccessoryRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public IEnumerable<Accessory> GetAllAccessories()
        {

            return QueryHelper<Accessory>.Query("dbo.Accessory_GETALL", _connectionString);
        }

        public IEnumerable<Accessory> GetAccessoriesByName(string name)
        {
            return QueryHelper<Accessory>.Query("dbo.Accessory_GetByName @Name", new { Name = name }, _connectionString);
        }

        public void Insert(string name)
        {
            QueryHelper<Accessory>.Execute("dbo.Accessory_Insert @Name", new { Name = name }, _connectionString);
        }

        public void Update(int id, string newName)
        {
            QueryHelper<Accessory>.Execute("dbo.Accessory_Update @Id, @NewName", new { Id = id, NewName = newName }, _connectionString);
        }

        public void Delete(int id)
        {
            QueryHelper<Accessory>.Execute("dbo.Accessory_Delete @Id", new { Id = id }, _connectionString);
        }
    }
}
