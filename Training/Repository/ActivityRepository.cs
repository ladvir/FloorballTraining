using Dapper;
using Domain;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace Repository
{
    public class ActivityRepository
    {
        private string _connectionString;

        public ActivityRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<Activity> GetActivities()
        {
            if (string.IsNullOrEmpty(_connectionString)) throw new Exception("Není nastaveno připojení k databázi");

            using (IDbConnection connection = new System.Data.SqlClient.SqlConnection(_connectionString))
            {
                return connection.Query<Activity>("dbo.ACTIVITY_GETALL").ToList();
            }
        }


        public List<Activity> GetActivitiesWithDetails()
        {
            if (string.IsNullOrEmpty(_connectionString)) throw new Exception("Není nastaveno připojení k databázi");

            using (IDbConnection connection = new System.Data.SqlClient.SqlConnection(_connectionString))
            {
                var sql = @"select a.id, a.name, a.duration, aid.id as aidid, aid.name, at.id as activitytypeId, at.name, aim.id as aimid, aim.name 
                from activity a 
                left join activityAid aa on aa.activityId=a.id 
                left join aid on aid.id=aa.aidid 
                left join activityactivitytype aat on aat.activityId=a.id 
                left join activitytype at on at.id=aat.activitytypeid
                left join activityAim am on am.activityId=a.id 
                left join aim on aim.id=am.aimid 
                ";



                var activities = connection.Query<Activity, Aid, ActivityType, Activity>(sql, (activity, aid, activityType) =>
                {
                    activity.ActivityTypes.Add(activityType);
                    activity.Aids.Add(aid);
                    return activity;
                }, splitOn: "Id,aidid,activitytypeId,aimid");


                var result = activities.GroupBy(p => p.Id).Select(g =>
                {
                    var groupedActivity = g.First();
                    groupedActivity.Aids = g.Select(p => p.Aids.FirstOrDefault()).ToList();
                    groupedActivity.Aims = g.Select(p => p.Aims.FirstOrDefault()).ToList();
                    groupedActivity.ActivityTypes = g.Select(p => p.ActivityTypes.FirstOrDefault()).ToList();
                    return groupedActivity;
                });


                return result.ToList();
            }
        }
    }
}
