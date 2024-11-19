using System;
using System.Data;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Components;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Radzen;

using FloorballTraining.Web.Data;

namespace FloorballTraining.Web
{
    public partial class FloorballTrainingConfigurationService
    {
        FloorballTrainingConfigurationContext Context
        {
           get
           {
             return this.context;
           }
        }

        private readonly FloorballTrainingConfigurationContext context;
        private readonly NavigationManager navigationManager;

        public FloorballTrainingConfigurationService(FloorballTrainingConfigurationContext context, NavigationManager navigationManager)
        {
            this.context = context;
            this.navigationManager = navigationManager;
        }

        public void Reset() => Context.ChangeTracker.Entries().Where(e => e.Entity != null).ToList().ForEach(e => e.State = EntityState.Detached);

        public void ApplyQuery<T>(ref IQueryable<T> items, Query query = null)
        {
            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Filter))
                {
                    if (query.FilterParameters != null)
                    {
                        items = items.Where(query.Filter, query.FilterParameters);
                    }
                    else
                    {
                        items = items.Where(query.Filter);
                    }
                }

                if (!string.IsNullOrEmpty(query.OrderBy))
                {
                    items = items.OrderBy(query.OrderBy);
                }

                if (query.Skip.HasValue)
                {
                    items = items.Skip(query.Skip.Value);
                }

                if (query.Top.HasValue)
                {
                    items = items.Take(query.Top.Value);
                }
            }
        }


        public async Task ExportActivitiesToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activities/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activities/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivitiesToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activities/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activities/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivitiesRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity>> GetActivities(Query query = null)
        {
            var items = Context.Activities.AsQueryable();


            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnActivitiesRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnActivityGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity item);
        partial void OnGetActivityById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity> GetActivityById(int id)
        {
            var items = Context.Activities
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetActivityById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnActivityGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnActivityCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity item);
        partial void OnAfterActivityCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity> CreateActivity(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity activity)
        {
            OnActivityCreated(activity);

            var existingItem = Context.Activities
                              .Where(i => i.Id == activity.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.Activities.Add(activity);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(activity).State = EntityState.Detached;
                throw;
            }

            OnAfterActivityCreated(activity);

            return activity;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity> CancelActivityChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity item);
        partial void OnAfterActivityUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity> UpdateActivity(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity activity)
        {
            OnActivityUpdated(activity);

            var itemToUpdate = Context.Activities
                              .Where(i => i.Id == activity.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(activity);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterActivityUpdated(activity);

            return activity;
        }

        partial void OnActivityDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity item);
        partial void OnAfterActivityDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity> DeleteActivity(int id)
        {
            var itemToDelete = Context.Activities
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnActivityDeleted(itemToDelete);


            Context.Activities.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterActivityDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportActivityAgeGroupsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activityagegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activityagegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivityAgeGroupsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activityagegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activityagegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivityAgeGroupsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup>> GetActivityAgeGroups(Query query = null)
        {
            var items = Context.ActivityAgeGroups.AsQueryable();

            items = items.Include(i => i.Activity);
            items = items.Include(i => i.AgeGroup);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnActivityAgeGroupsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnActivityAgeGroupGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup item);
        partial void OnGetActivityAgeGroupById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup> GetActivityAgeGroupById(int id)
        {
            var items = Context.ActivityAgeGroups
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Activity);
            items = items.Include(i => i.AgeGroup);
 
            OnGetActivityAgeGroupById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnActivityAgeGroupGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnActivityAgeGroupCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup item);
        partial void OnAfterActivityAgeGroupCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup> CreateActivityAgeGroup(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup activityagegroup)
        {
            OnActivityAgeGroupCreated(activityagegroup);

            var existingItem = Context.ActivityAgeGroups
                              .Where(i => i.Id == activityagegroup.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.ActivityAgeGroups.Add(activityagegroup);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(activityagegroup).State = EntityState.Detached;
                throw;
            }

            OnAfterActivityAgeGroupCreated(activityagegroup);

            return activityagegroup;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup> CancelActivityAgeGroupChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityAgeGroupUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup item);
        partial void OnAfterActivityAgeGroupUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup> UpdateActivityAgeGroup(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup activityagegroup)
        {
            OnActivityAgeGroupUpdated(activityagegroup);

            var itemToUpdate = Context.ActivityAgeGroups
                              .Where(i => i.Id == activityagegroup.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(activityagegroup);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterActivityAgeGroupUpdated(activityagegroup);

            return activityagegroup;
        }

        partial void OnActivityAgeGroupDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup item);
        partial void OnAfterActivityAgeGroupDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup> DeleteActivityAgeGroup(int id)
        {
            var itemToDelete = Context.ActivityAgeGroups
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnActivityAgeGroupDeleted(itemToDelete);


            Context.ActivityAgeGroups.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterActivityAgeGroupDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportActivityEquipmentsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activityequipments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activityequipments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivityEquipmentsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activityequipments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activityequipments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivityEquipmentsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment>> GetActivityEquipments(Query query = null)
        {
            var items = Context.ActivityEquipments.AsQueryable();

            items = items.Include(i => i.Activity);
            items = items.Include(i => i.Equipment);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnActivityEquipmentsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnActivityEquipmentGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment item);
        partial void OnGetActivityEquipmentById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment> GetActivityEquipmentById(int id)
        {
            var items = Context.ActivityEquipments
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Activity);
            items = items.Include(i => i.Equipment);
 
            OnGetActivityEquipmentById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnActivityEquipmentGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnActivityEquipmentCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment item);
        partial void OnAfterActivityEquipmentCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment> CreateActivityEquipment(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment activityequipment)
        {
            OnActivityEquipmentCreated(activityequipment);

            var existingItem = Context.ActivityEquipments
                              .Where(i => i.Id == activityequipment.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.ActivityEquipments.Add(activityequipment);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(activityequipment).State = EntityState.Detached;
                throw;
            }

            OnAfterActivityEquipmentCreated(activityequipment);

            return activityequipment;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment> CancelActivityEquipmentChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityEquipmentUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment item);
        partial void OnAfterActivityEquipmentUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment> UpdateActivityEquipment(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment activityequipment)
        {
            OnActivityEquipmentUpdated(activityequipment);

            var itemToUpdate = Context.ActivityEquipments
                              .Where(i => i.Id == activityequipment.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(activityequipment);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterActivityEquipmentUpdated(activityequipment);

            return activityequipment;
        }

        partial void OnActivityEquipmentDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment item);
        partial void OnAfterActivityEquipmentDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment> DeleteActivityEquipment(int id)
        {
            var itemToDelete = Context.ActivityEquipments
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnActivityEquipmentDeleted(itemToDelete);


            Context.ActivityEquipments.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterActivityEquipmentDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportActivityMediaToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activitymedia/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activitymedia/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivityMediaToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activitymedia/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activitymedia/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivityMediaRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium>> GetActivityMedia(Query query = null)
        {
            var items = Context.ActivityMedia.AsQueryable();

            items = items.Include(i => i.Activity);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnActivityMediaRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnActivityMediumGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium item);
        partial void OnGetActivityMediumById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium> GetActivityMediumById(int id)
        {
            var items = Context.ActivityMedia
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Activity);
 
            OnGetActivityMediumById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnActivityMediumGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnActivityMediumCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium item);
        partial void OnAfterActivityMediumCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium> CreateActivityMedium(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium activitymedium)
        {
            OnActivityMediumCreated(activitymedium);

            var existingItem = Context.ActivityMedia
                              .Where(i => i.Id == activitymedium.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.ActivityMedia.Add(activitymedium);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(activitymedium).State = EntityState.Detached;
                throw;
            }

            OnAfterActivityMediumCreated(activitymedium);

            return activitymedium;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium> CancelActivityMediumChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityMediumUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium item);
        partial void OnAfterActivityMediumUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium> UpdateActivityMedium(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium activitymedium)
        {
            OnActivityMediumUpdated(activitymedium);

            var itemToUpdate = Context.ActivityMedia
                              .Where(i => i.Id == activitymedium.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(activitymedium);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterActivityMediumUpdated(activitymedium);

            return activitymedium;
        }

        partial void OnActivityMediumDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium item);
        partial void OnAfterActivityMediumDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium> DeleteActivityMedium(int id)
        {
            var itemToDelete = Context.ActivityMedia
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnActivityMediumDeleted(itemToDelete);


            Context.ActivityMedia.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterActivityMediumDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportActivityTagsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activitytags/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activitytags/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivityTagsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/activitytags/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/activitytags/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivityTagsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag>> GetActivityTags(Query query = null)
        {
            var items = Context.ActivityTags.AsQueryable();

            items = items.Include(i => i.Activity);
            items = items.Include(i => i.Tag);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnActivityTagsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnActivityTagGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag item);
        partial void OnGetActivityTagById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag> GetActivityTagById(int id)
        {
            var items = Context.ActivityTags
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Activity);
            items = items.Include(i => i.Tag);
 
            OnGetActivityTagById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnActivityTagGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnActivityTagCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag item);
        partial void OnAfterActivityTagCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag> CreateActivityTag(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag activitytag)
        {
            OnActivityTagCreated(activitytag);

            var existingItem = Context.ActivityTags
                              .Where(i => i.Id == activitytag.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.ActivityTags.Add(activitytag);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(activitytag).State = EntityState.Detached;
                throw;
            }

            OnAfterActivityTagCreated(activitytag);

            return activitytag;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag> CancelActivityTagChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityTagUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag item);
        partial void OnAfterActivityTagUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag> UpdateActivityTag(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag activitytag)
        {
            OnActivityTagUpdated(activitytag);

            var itemToUpdate = Context.ActivityTags
                              .Where(i => i.Id == activitytag.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(activitytag);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterActivityTagUpdated(activitytag);

            return activitytag;
        }

        partial void OnActivityTagDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag item);
        partial void OnAfterActivityTagDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag> DeleteActivityTag(int id)
        {
            var itemToDelete = Context.ActivityTags
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnActivityTagDeleted(itemToDelete);


            Context.ActivityTags.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterActivityTagDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportAgeGroupsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/agegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/agegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportAgeGroupsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/agegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/agegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnAgeGroupsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup>> GetAgeGroups(Query query = null)
        {
            var items = Context.AgeGroups.AsQueryable();


            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnAgeGroupsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnAgeGroupGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup item);
        partial void OnGetAgeGroupById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup> GetAgeGroupById(int id)
        {
            var items = Context.AgeGroups
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetAgeGroupById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnAgeGroupGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnAgeGroupCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup item);
        partial void OnAfterAgeGroupCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup> CreateAgeGroup(FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup agegroup)
        {
            OnAgeGroupCreated(agegroup);

            var existingItem = Context.AgeGroups
                              .Where(i => i.Id == agegroup.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.AgeGroups.Add(agegroup);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(agegroup).State = EntityState.Detached;
                throw;
            }

            OnAfterAgeGroupCreated(agegroup);

            return agegroup;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup> CancelAgeGroupChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnAgeGroupUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup item);
        partial void OnAfterAgeGroupUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup> UpdateAgeGroup(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup agegroup)
        {
            OnAgeGroupUpdated(agegroup);

            var itemToUpdate = Context.AgeGroups
                              .Where(i => i.Id == agegroup.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(agegroup);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterAgeGroupUpdated(agegroup);

            return agegroup;
        }

        partial void OnAgeGroupDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup item);
        partial void OnAfterAgeGroupDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup> DeleteAgeGroup(int id)
        {
            var itemToDelete = Context.AgeGroups
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnAgeGroupDeleted(itemToDelete);


            Context.AgeGroups.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterAgeGroupDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportAppointmentsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/appointments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/appointments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportAppointmentsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/appointments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/appointments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnAppointmentsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment>> GetAppointments(Query query = null)
        {
            var items = Context.Appointments.AsQueryable();

            items = items.Include(i => i.Place);
            items = items.Include(i => i.Appointment1);
            items = items.Include(i => i.Team);
            items = items.Include(i => i.Training);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnAppointmentsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnAppointmentGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment item);
        partial void OnGetAppointmentById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment> GetAppointmentById(int id)
        {
            var items = Context.Appointments
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Place);
            items = items.Include(i => i.Appointment1);
            items = items.Include(i => i.Team);
            items = items.Include(i => i.Training);
 
            OnGetAppointmentById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnAppointmentGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnAppointmentCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment item);
        partial void OnAfterAppointmentCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment> CreateAppointment(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment appointment)
        {
            OnAppointmentCreated(appointment);

            var existingItem = Context.Appointments
                              .Where(i => i.Id == appointment.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.Appointments.Add(appointment);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(appointment).State = EntityState.Detached;
                throw;
            }

            OnAfterAppointmentCreated(appointment);

            return appointment;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment> CancelAppointmentChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnAppointmentUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment item);
        partial void OnAfterAppointmentUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment> UpdateAppointment(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment appointment)
        {
            OnAppointmentUpdated(appointment);

            var itemToUpdate = Context.Appointments
                              .Where(i => i.Id == appointment.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(appointment);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterAppointmentUpdated(appointment);

            return appointment;
        }

        partial void OnAppointmentDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment item);
        partial void OnAfterAppointmentDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment> DeleteAppointment(int id)
        {
            var itemToDelete = Context.Appointments
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnAppointmentDeleted(itemToDelete);


            Context.Appointments.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterAppointmentDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportClubsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/clubs/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/clubs/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportClubsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/clubs/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/clubs/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnClubsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club>> GetClubs(Query query = null)
        {
            var items = Context.Clubs.AsQueryable();


            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnClubsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnClubGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club item);
        partial void OnGetClubById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club> GetClubById(int id)
        {
            var items = Context.Clubs
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetClubById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnClubGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnClubCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club item);
        partial void OnAfterClubCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club> CreateClub(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club club)
        {
            OnClubCreated(club);

            var existingItem = Context.Clubs
                              .Where(i => i.Id == club.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.Clubs.Add(club);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(club).State = EntityState.Detached;
                throw;
            }

            OnAfterClubCreated(club);

            return club;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club> CancelClubChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnClubUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club item);
        partial void OnAfterClubUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club> UpdateClub(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club club)
        {
            OnClubUpdated(club);

            var itemToUpdate = Context.Clubs
                              .Where(i => i.Id == club.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(club);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterClubUpdated(club);

            return club;
        }

        partial void OnClubDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club item);
        partial void OnAfterClubDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club> DeleteClub(int id)
        {
            var itemToDelete = Context.Clubs
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnClubDeleted(itemToDelete);


            Context.Clubs.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterClubDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportEquipmentsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/equipments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/equipments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportEquipmentsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/equipments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/equipments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnEquipmentsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment>> GetEquipments(Query query = null)
        {
            var items = Context.Equipments.AsQueryable();


            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnEquipmentsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnEquipmentGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment item);
        partial void OnGetEquipmentById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment> GetEquipmentById(int id)
        {
            var items = Context.Equipments
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetEquipmentById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnEquipmentGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnEquipmentCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment item);
        partial void OnAfterEquipmentCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment> CreateEquipment(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment equipment)
        {
            OnEquipmentCreated(equipment);

            var existingItem = Context.Equipments
                              .Where(i => i.Id == equipment.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.Equipments.Add(equipment);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(equipment).State = EntityState.Detached;
                throw;
            }

            OnAfterEquipmentCreated(equipment);

            return equipment;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment> CancelEquipmentChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnEquipmentUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment item);
        partial void OnAfterEquipmentUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment> UpdateEquipment(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment equipment)
        {
            OnEquipmentUpdated(equipment);

            var itemToUpdate = Context.Equipments
                              .Where(i => i.Id == equipment.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(equipment);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterEquipmentUpdated(equipment);

            return equipment;
        }

        partial void OnEquipmentDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment item);
        partial void OnAfterEquipmentDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment> DeleteEquipment(int id)
        {
            var itemToDelete = Context.Equipments
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnEquipmentDeleted(itemToDelete);


            Context.Equipments.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterEquipmentDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportMembersToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/members/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/members/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportMembersToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/members/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/members/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnMembersRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member>> GetMembers(Query query = null)
        {
            var items = Context.Members.AsQueryable();

            items = items.Include(i => i.Club);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnMembersRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnMemberGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member item);
        partial void OnGetMemberById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member> GetMemberById(int id)
        {
            var items = Context.Members
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Club);
 
            OnGetMemberById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnMemberGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnMemberCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member item);
        partial void OnAfterMemberCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member> CreateMember(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member member)
        {
            OnMemberCreated(member);

            var existingItem = Context.Members
                              .Where(i => i.Id == member.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.Members.Add(member);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(member).State = EntityState.Detached;
                throw;
            }

            OnAfterMemberCreated(member);

            return member;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member> CancelMemberChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnMemberUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member item);
        partial void OnAfterMemberUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member> UpdateMember(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member member)
        {
            OnMemberUpdated(member);

            var itemToUpdate = Context.Members
                              .Where(i => i.Id == member.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(member);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterMemberUpdated(member);

            return member;
        }

        partial void OnMemberDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member item);
        partial void OnAfterMemberDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member> DeleteMember(int id)
        {
            var itemToDelete = Context.Members
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnMemberDeleted(itemToDelete);


            Context.Members.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterMemberDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportPlacesToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/places/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/places/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportPlacesToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/places/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/places/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnPlacesRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place>> GetPlaces(Query query = null)
        {
            var items = Context.Places.AsQueryable();


            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnPlacesRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnPlaceGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place item);
        partial void OnGetPlaceById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place> GetPlaceById(int id)
        {
            var items = Context.Places
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetPlaceById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnPlaceGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnPlaceCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place item);
        partial void OnAfterPlaceCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place> CreatePlace(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place place)
        {
            OnPlaceCreated(place);

            var existingItem = Context.Places
                              .Where(i => i.Id == place.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.Places.Add(place);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(place).State = EntityState.Detached;
                throw;
            }

            OnAfterPlaceCreated(place);

            return place;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place> CancelPlaceChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnPlaceUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place item);
        partial void OnAfterPlaceUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place> UpdatePlace(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place place)
        {
            OnPlaceUpdated(place);

            var itemToUpdate = Context.Places
                              .Where(i => i.Id == place.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(place);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterPlaceUpdated(place);

            return place;
        }

        partial void OnPlaceDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place item);
        partial void OnAfterPlaceDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place> DeletePlace(int id)
        {
            var itemToDelete = Context.Places
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnPlaceDeleted(itemToDelete);


            Context.Places.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterPlaceDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportRepeatingPatternsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/repeatingpatterns/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/repeatingpatterns/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportRepeatingPatternsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/repeatingpatterns/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/repeatingpatterns/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnRepeatingPatternsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern>> GetRepeatingPatterns(Query query = null)
        {
            var items = Context.RepeatingPatterns.AsQueryable();

            items = items.Include(i => i.Appointment);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnRepeatingPatternsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnRepeatingPatternGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern item);
        partial void OnGetRepeatingPatternById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern> GetRepeatingPatternById(int id)
        {
            var items = Context.RepeatingPatterns
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Appointment);
 
            OnGetRepeatingPatternById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnRepeatingPatternGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnRepeatingPatternCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern item);
        partial void OnAfterRepeatingPatternCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern> CreateRepeatingPattern(FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern repeatingpattern)
        {
            OnRepeatingPatternCreated(repeatingpattern);

            var existingItem = Context.RepeatingPatterns
                              .Where(i => i.Id == repeatingpattern.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.RepeatingPatterns.Add(repeatingpattern);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(repeatingpattern).State = EntityState.Detached;
                throw;
            }

            OnAfterRepeatingPatternCreated(repeatingpattern);

            return repeatingpattern;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern> CancelRepeatingPatternChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnRepeatingPatternUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern item);
        partial void OnAfterRepeatingPatternUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern> UpdateRepeatingPattern(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern repeatingpattern)
        {
            OnRepeatingPatternUpdated(repeatingpattern);

            var itemToUpdate = Context.RepeatingPatterns
                              .Where(i => i.Id == repeatingpattern.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(repeatingpattern);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterRepeatingPatternUpdated(repeatingpattern);

            return repeatingpattern;
        }

        partial void OnRepeatingPatternDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern item);
        partial void OnAfterRepeatingPatternDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern> DeleteRepeatingPattern(int id)
        {
            var itemToDelete = Context.RepeatingPatterns
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnRepeatingPatternDeleted(itemToDelete);


            Context.RepeatingPatterns.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterRepeatingPatternDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportTagsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/tags/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/tags/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTagsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/tags/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/tags/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTagsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag>> GetTags(Query query = null)
        {
            var items = Context.Tags.AsQueryable();

            items = items.Include(i => i.Tag1);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnTagsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnTagGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag item);
        partial void OnGetTagById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag> GetTagById(int id)
        {
            var items = Context.Tags
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Tag1);
 
            OnGetTagById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnTagGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnTagCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag item);
        partial void OnAfterTagCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag> CreateTag(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag tag)
        {
            OnTagCreated(tag);

            var existingItem = Context.Tags
                              .Where(i => i.Id == tag.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.Tags.Add(tag);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(tag).State = EntityState.Detached;
                throw;
            }

            OnAfterTagCreated(tag);

            return tag;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag> CancelTagChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTagUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag item);
        partial void OnAfterTagUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag> UpdateTag(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag tag)
        {
            OnTagUpdated(tag);

            var itemToUpdate = Context.Tags
                              .Where(i => i.Id == tag.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(tag);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterTagUpdated(tag);

            return tag;
        }

        partial void OnTagDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag item);
        partial void OnAfterTagDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag> DeleteTag(int id)
        {
            var itemToDelete = Context.Tags
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnTagDeleted(itemToDelete);


            Context.Tags.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterTagDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportTeamMembersToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/teammembers/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/teammembers/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTeamMembersToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/teammembers/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/teammembers/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTeamMembersRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember>> GetTeamMembers(Query query = null)
        {
            var items = Context.TeamMembers.AsQueryable();

            items = items.Include(i => i.Member);
            items = items.Include(i => i.Team);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnTeamMembersRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnTeamMemberGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember item);
        partial void OnGetTeamMemberById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember> GetTeamMemberById(int id)
        {
            var items = Context.TeamMembers
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Member);
            items = items.Include(i => i.Team);
 
            OnGetTeamMemberById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnTeamMemberGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnTeamMemberCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember item);
        partial void OnAfterTeamMemberCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember> CreateTeamMember(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember teammember)
        {
            OnTeamMemberCreated(teammember);

            var existingItem = Context.TeamMembers
                              .Where(i => i.Id == teammember.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.TeamMembers.Add(teammember);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(teammember).State = EntityState.Detached;
                throw;
            }

            OnAfterTeamMemberCreated(teammember);

            return teammember;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember> CancelTeamMemberChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTeamMemberUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember item);
        partial void OnAfterTeamMemberUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember> UpdateTeamMember(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember teammember)
        {
            OnTeamMemberUpdated(teammember);

            var itemToUpdate = Context.TeamMembers
                              .Where(i => i.Id == teammember.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(teammember);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterTeamMemberUpdated(teammember);

            return teammember;
        }

        partial void OnTeamMemberDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember item);
        partial void OnAfterTeamMemberDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember> DeleteTeamMember(int id)
        {
            var itemToDelete = Context.TeamMembers
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnTeamMemberDeleted(itemToDelete);


            Context.TeamMembers.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterTeamMemberDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportTeamsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/teams/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/teams/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTeamsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/teams/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/teams/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTeamsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team>> GetTeams(Query query = null)
        {
            var items = Context.Teams.AsQueryable();

            items = items.Include(i => i.AgeGroup);
            items = items.Include(i => i.Club);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnTeamsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnTeamGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team item);
        partial void OnGetTeamById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team> GetTeamById(int id)
        {
            var items = Context.Teams
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.AgeGroup);
            items = items.Include(i => i.Club);
 
            OnGetTeamById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnTeamGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnTeamCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team item);
        partial void OnAfterTeamCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team> CreateTeam(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team team)
        {
            OnTeamCreated(team);

            var existingItem = Context.Teams
                              .Where(i => i.Id == team.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.Teams.Add(team);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(team).State = EntityState.Detached;
                throw;
            }

            OnAfterTeamCreated(team);

            return team;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team> CancelTeamChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTeamUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team item);
        partial void OnAfterTeamUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team> UpdateTeam(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team team)
        {
            OnTeamUpdated(team);

            var itemToUpdate = Context.Teams
                              .Where(i => i.Id == team.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(team);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterTeamUpdated(team);

            return team;
        }

        partial void OnTeamDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team item);
        partial void OnAfterTeamDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team> DeleteTeam(int id)
        {
            var itemToDelete = Context.Teams
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnTeamDeleted(itemToDelete);


            Context.Teams.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterTeamDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportTrainingAgeGroupsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/trainingagegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/trainingagegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTrainingAgeGroupsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/trainingagegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/trainingagegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTrainingAgeGroupsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup>> GetTrainingAgeGroups(Query query = null)
        {
            var items = Context.TrainingAgeGroups.AsQueryable();

            items = items.Include(i => i.AgeGroup);
            items = items.Include(i => i.Training);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnTrainingAgeGroupsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnTrainingAgeGroupGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup item);
        partial void OnGetTrainingAgeGroupById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup> GetTrainingAgeGroupById(int id)
        {
            var items = Context.TrainingAgeGroups
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.AgeGroup);
            items = items.Include(i => i.Training);
 
            OnGetTrainingAgeGroupById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnTrainingAgeGroupGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnTrainingAgeGroupCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup item);
        partial void OnAfterTrainingAgeGroupCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup> CreateTrainingAgeGroup(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup trainingagegroup)
        {
            OnTrainingAgeGroupCreated(trainingagegroup);

            var existingItem = Context.TrainingAgeGroups
                              .Where(i => i.Id == trainingagegroup.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.TrainingAgeGroups.Add(trainingagegroup);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(trainingagegroup).State = EntityState.Detached;
                throw;
            }

            OnAfterTrainingAgeGroupCreated(trainingagegroup);

            return trainingagegroup;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup> CancelTrainingAgeGroupChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTrainingAgeGroupUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup item);
        partial void OnAfterTrainingAgeGroupUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup> UpdateTrainingAgeGroup(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup trainingagegroup)
        {
            OnTrainingAgeGroupUpdated(trainingagegroup);

            var itemToUpdate = Context.TrainingAgeGroups
                              .Where(i => i.Id == trainingagegroup.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(trainingagegroup);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterTrainingAgeGroupUpdated(trainingagegroup);

            return trainingagegroup;
        }

        partial void OnTrainingAgeGroupDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup item);
        partial void OnAfterTrainingAgeGroupDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup> DeleteTrainingAgeGroup(int id)
        {
            var itemToDelete = Context.TrainingAgeGroups
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnTrainingAgeGroupDeleted(itemToDelete);


            Context.TrainingAgeGroups.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterTrainingAgeGroupDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportTrainingGroupsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/traininggroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/traininggroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTrainingGroupsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/traininggroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/traininggroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTrainingGroupsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup>> GetTrainingGroups(Query query = null)
        {
            var items = Context.TrainingGroups.AsQueryable();

            items = items.Include(i => i.Activity);
            items = items.Include(i => i.TrainingPart);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnTrainingGroupsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnTrainingGroupGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup item);
        partial void OnGetTrainingGroupById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup> GetTrainingGroupById(int id)
        {
            var items = Context.TrainingGroups
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Activity);
            items = items.Include(i => i.TrainingPart);
 
            OnGetTrainingGroupById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnTrainingGroupGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnTrainingGroupCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup item);
        partial void OnAfterTrainingGroupCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup> CreateTrainingGroup(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup traininggroup)
        {
            OnTrainingGroupCreated(traininggroup);

            var existingItem = Context.TrainingGroups
                              .Where(i => i.Id == traininggroup.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.TrainingGroups.Add(traininggroup);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(traininggroup).State = EntityState.Detached;
                throw;
            }

            OnAfterTrainingGroupCreated(traininggroup);

            return traininggroup;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup> CancelTrainingGroupChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTrainingGroupUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup item);
        partial void OnAfterTrainingGroupUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup> UpdateTrainingGroup(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup traininggroup)
        {
            OnTrainingGroupUpdated(traininggroup);

            var itemToUpdate = Context.TrainingGroups
                              .Where(i => i.Id == traininggroup.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(traininggroup);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterTrainingGroupUpdated(traininggroup);

            return traininggroup;
        }

        partial void OnTrainingGroupDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup item);
        partial void OnAfterTrainingGroupDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup> DeleteTrainingGroup(int id)
        {
            var itemToDelete = Context.TrainingGroups
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnTrainingGroupDeleted(itemToDelete);


            Context.TrainingGroups.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterTrainingGroupDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportTrainingPartsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/trainingparts/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/trainingparts/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTrainingPartsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/trainingparts/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/trainingparts/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTrainingPartsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart>> GetTrainingParts(Query query = null)
        {
            var items = Context.TrainingParts.AsQueryable();

            items = items.Include(i => i.Training);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnTrainingPartsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnTrainingPartGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart item);
        partial void OnGetTrainingPartById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart> GetTrainingPartById(int id)
        {
            var items = Context.TrainingParts
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Training);
 
            OnGetTrainingPartById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnTrainingPartGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnTrainingPartCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart item);
        partial void OnAfterTrainingPartCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart> CreateTrainingPart(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart trainingpart)
        {
            OnTrainingPartCreated(trainingpart);

            var existingItem = Context.TrainingParts
                              .Where(i => i.Id == trainingpart.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.TrainingParts.Add(trainingpart);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(trainingpart).State = EntityState.Detached;
                throw;
            }

            OnAfterTrainingPartCreated(trainingpart);

            return trainingpart;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart> CancelTrainingPartChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTrainingPartUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart item);
        partial void OnAfterTrainingPartUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart> UpdateTrainingPart(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart trainingpart)
        {
            OnTrainingPartUpdated(trainingpart);

            var itemToUpdate = Context.TrainingParts
                              .Where(i => i.Id == trainingpart.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(trainingpart);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterTrainingPartUpdated(trainingpart);

            return trainingpart;
        }

        partial void OnTrainingPartDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart item);
        partial void OnAfterTrainingPartDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart> DeleteTrainingPart(int id)
        {
            var itemToDelete = Context.TrainingParts
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnTrainingPartDeleted(itemToDelete);


            Context.TrainingParts.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterTrainingPartDeleted(itemToDelete);

            return itemToDelete;
        }
    
        public async Task ExportTrainingsToExcel(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/trainings/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/trainings/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTrainingsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingconfiguration/trainings/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingconfiguration/trainings/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTrainingsRead(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training> items);

        public async Task<IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training>> GetTrainings(Query query = null)
        {
            var items = Context.Trainings.AsQueryable();

            items = items.Include(i => i.Place);
            items = items.Include(i => i.Tag);
            items = items.Include(i => i.Tag1);
            items = items.Include(i => i.Tag2);

            if (query != null)
            {
                if (!string.IsNullOrEmpty(query.Expand))
                {
                    var propertiesToExpand = query.Expand.Split(',');
                    foreach(var p in propertiesToExpand)
                    {
                        items = items.Include(p.Trim());
                    }
                }

                ApplyQuery(ref items, query);
            }

            OnTrainingsRead(ref items);

            return await Task.FromResult(items);
        }

        partial void OnTrainingGet(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training item);
        partial void OnGetTrainingById(ref IQueryable<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training> items);


        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training> GetTrainingById(int id)
        {
            var items = Context.Trainings
                              .AsNoTracking()
                              .Where(i => i.Id == id);

            items = items.Include(i => i.Place);
            items = items.Include(i => i.Tag);
            items = items.Include(i => i.Tag1);
            items = items.Include(i => i.Tag2);
 
            OnGetTrainingById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnTrainingGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnTrainingCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training item);
        partial void OnAfterTrainingCreated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training> CreateTraining(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training training)
        {
            OnTrainingCreated(training);

            var existingItem = Context.Trainings
                              .Where(i => i.Id == training.Id)
                              .FirstOrDefault();

            if (existingItem != null)
            {
               throw new Exception("Item already available");
            }            

            try
            {
                Context.Trainings.Add(training);
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(training).State = EntityState.Detached;
                throw;
            }

            OnAfterTrainingCreated(training);

            return training;
        }

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training> CancelTrainingChanges(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTrainingUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training item);
        partial void OnAfterTrainingUpdated(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training> UpdateTraining(int id, FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training training)
        {
            OnTrainingUpdated(training);

            var itemToUpdate = Context.Trainings
                              .Where(i => i.Id == training.Id)
                              .FirstOrDefault();

            if (itemToUpdate == null)
            {
               throw new Exception("Item no longer available");
            }
                
            var entryToUpdate = Context.Entry(itemToUpdate);
            entryToUpdate.CurrentValues.SetValues(training);
            entryToUpdate.State = EntityState.Modified;

            Context.SaveChanges();

            OnAfterTrainingUpdated(training);

            return training;
        }

        partial void OnTrainingDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training item);
        partial void OnAfterTrainingDeleted(FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training item);

        public async Task<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training> DeleteTraining(int id)
        {
            var itemToDelete = Context.Trainings
                              .Where(i => i.Id == id)
                              .FirstOrDefault();

            if (itemToDelete == null)
            {
               throw new Exception("Item no longer available");
            }

            OnTrainingDeleted(itemToDelete);


            Context.Trainings.Remove(itemToDelete);

            try
            {
                Context.SaveChanges();
            }
            catch
            {
                Context.Entry(itemToDelete).State = EntityState.Unchanged;
                throw;
            }

            OnAfterTrainingDeleted(itemToDelete);

            return itemToDelete;
        }
        }
}