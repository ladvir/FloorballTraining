﻿using System.Configuration;

namespace TrainingAppWPF
{
    public static class Helper
    {
        public static string ConnectionStringValue(string connectionStringName)
        {
            return ConfigurationManager.ConnectionStrings[connectionStringName].ConnectionString;
        }
    }
}
