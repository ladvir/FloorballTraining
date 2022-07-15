using Dapper;
using System;
using System.Collections.Generic;
using System.Data;

namespace Repository
{
    public static class QueryHelper<T>
    {
        public static IEnumerable<T> Query(string sql, object param, string connectionString)
        {
            if (string.IsNullOrEmpty(connectionString)) throw new Exception("Není nastaveno připojení k databázi");

            using (IDbConnection connection = new System.Data.SqlClient.SqlConnection(connectionString))
            {
                return connection.Query<T>(sql, param);
            }
        }


        public static IEnumerable<T> Query(string sql, string connectionString)
        {
            return Query(sql, null, connectionString);
        }


        public static void Execute(string sql, object param, string connectionString)
        {
            if (string.IsNullOrEmpty(connectionString)) throw new Exception("Není nastaveno připojení k databázi");

            using (IDbConnection connection = new System.Data.SqlClient.SqlConnection(connectionString))
            {
                connection.Execute(sql, param);
            }
        }
    }
}
