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

using FloorballTraining.Identity.Data;

namespace FloorballTraining.Identity
{
    public partial class FloorballTrainingIdentityService
    {
        FloorballTrainingIdentityContext Context
        {
           get
           {
             return this.context;
           }
        }

        private readonly FloorballTrainingIdentityContext context;
        private readonly NavigationManager navigationManager;

        public FloorballTrainingIdentityService(FloorballTrainingIdentityContext context, NavigationManager navigationManager)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activities/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activities/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivitiesToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activities/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activities/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivitiesRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity>> GetActivities(Query query = null)
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

        partial void OnActivityGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity item);
        partial void OnGetActivityById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity> GetActivityById(int id)
        {
            var items = Context.Activities
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetActivityById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnActivityGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnActivityCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity item);
        partial void OnAfterActivityCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity> CreateActivity(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity activity)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity> CancelActivityChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity item);
        partial void OnAfterActivityUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity> UpdateActivity(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity activity)
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

        partial void OnActivityDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity item);
        partial void OnAfterActivityDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity> DeleteActivity(int id)
        {
            var itemToDelete = Context.Activities
                              .Where(i => i.Id == id)
                              .Include(i => i.ActivityAgeGroups)
                              .Include(i => i.ActivityEquipments)
                              .Include(i => i.ActivityMedia)
                              .Include(i => i.ActivityTags)
                              .Include(i => i.TrainingGroups)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activityagegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activityagegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivityAgeGroupsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activityagegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activityagegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivityAgeGroupsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup>> GetActivityAgeGroups(Query query = null)
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

        partial void OnActivityAgeGroupGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup item);
        partial void OnGetActivityAgeGroupById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup> GetActivityAgeGroupById(int id)
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

        partial void OnActivityAgeGroupCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup item);
        partial void OnAfterActivityAgeGroupCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup> CreateActivityAgeGroup(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup activityagegroup)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup> CancelActivityAgeGroupChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityAgeGroupUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup item);
        partial void OnAfterActivityAgeGroupUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup> UpdateActivityAgeGroup(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup activityagegroup)
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

        partial void OnActivityAgeGroupDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup item);
        partial void OnAfterActivityAgeGroupDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup> DeleteActivityAgeGroup(int id)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activityequipments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activityequipments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivityEquipmentsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activityequipments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activityequipments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivityEquipmentsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment>> GetActivityEquipments(Query query = null)
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

        partial void OnActivityEquipmentGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment item);
        partial void OnGetActivityEquipmentById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment> GetActivityEquipmentById(int id)
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

        partial void OnActivityEquipmentCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment item);
        partial void OnAfterActivityEquipmentCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment> CreateActivityEquipment(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment activityequipment)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment> CancelActivityEquipmentChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityEquipmentUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment item);
        partial void OnAfterActivityEquipmentUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment> UpdateActivityEquipment(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment activityequipment)
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

        partial void OnActivityEquipmentDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment item);
        partial void OnAfterActivityEquipmentDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment> DeleteActivityEquipment(int id)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activitymedia/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activitymedia/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivityMediaToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activitymedia/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activitymedia/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivityMediaRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium>> GetActivityMedia(Query query = null)
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

        partial void OnActivityMediumGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium item);
        partial void OnGetActivityMediumById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium> GetActivityMediumById(int id)
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

        partial void OnActivityMediumCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium item);
        partial void OnAfterActivityMediumCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium> CreateActivityMedium(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium activitymedium)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium> CancelActivityMediumChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityMediumUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium item);
        partial void OnAfterActivityMediumUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium> UpdateActivityMedium(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium activitymedium)
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

        partial void OnActivityMediumDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium item);
        partial void OnAfterActivityMediumDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium> DeleteActivityMedium(int id)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activitytags/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activitytags/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportActivityTagsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/activitytags/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/activitytags/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnActivityTagsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag>> GetActivityTags(Query query = null)
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

        partial void OnActivityTagGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag item);
        partial void OnGetActivityTagById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag> GetActivityTagById(int id)
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

        partial void OnActivityTagCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag item);
        partial void OnAfterActivityTagCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag> CreateActivityTag(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag activitytag)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag> CancelActivityTagChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnActivityTagUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag item);
        partial void OnAfterActivityTagUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag> UpdateActivityTag(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag activitytag)
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

        partial void OnActivityTagDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag item);
        partial void OnAfterActivityTagDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag> DeleteActivityTag(int id)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/agegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/agegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportAgeGroupsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/agegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/agegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnAgeGroupsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup>> GetAgeGroups(Query query = null)
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

        partial void OnAgeGroupGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup item);
        partial void OnGetAgeGroupById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup> GetAgeGroupById(int id)
        {
            var items = Context.AgeGroups
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetAgeGroupById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnAgeGroupGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnAgeGroupCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup item);
        partial void OnAfterAgeGroupCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup> CreateAgeGroup(FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup agegroup)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup> CancelAgeGroupChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnAgeGroupUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup item);
        partial void OnAfterAgeGroupUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup> UpdateAgeGroup(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup agegroup)
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

        partial void OnAgeGroupDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup item);
        partial void OnAfterAgeGroupDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup> DeleteAgeGroup(int id)
        {
            var itemToDelete = Context.AgeGroups
                              .Where(i => i.Id == id)
                              .Include(i => i.ActivityAgeGroups)
                              .Include(i => i.Teams)
                              .Include(i => i.TrainingAgeGroups)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/appointments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/appointments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportAppointmentsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/appointments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/appointments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnAppointmentsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment>> GetAppointments(Query query = null)
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

        partial void OnAppointmentGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment item);
        partial void OnGetAppointmentById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment> GetAppointmentById(int id)
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

        partial void OnAppointmentCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment item);
        partial void OnAfterAppointmentCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment> CreateAppointment(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment appointment)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment> CancelAppointmentChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnAppointmentUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment item);
        partial void OnAfterAppointmentUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment> UpdateAppointment(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment appointment)
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

        partial void OnAppointmentDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment item);
        partial void OnAfterAppointmentDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment> DeleteAppointment(int id)
        {
            var itemToDelete = Context.Appointments
                              .Where(i => i.Id == id)
                              .Include(i => i.Appointments1)
                              .Include(i => i.RepeatingPatterns)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/clubs/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/clubs/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportClubsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/clubs/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/clubs/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnClubsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club>> GetClubs(Query query = null)
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

        partial void OnClubGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club item);
        partial void OnGetClubById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club> GetClubById(int id)
        {
            var items = Context.Clubs
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetClubById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnClubGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnClubCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club item);
        partial void OnAfterClubCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club> CreateClub(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club club)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club> CancelClubChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnClubUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club item);
        partial void OnAfterClubUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club> UpdateClub(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club club)
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

        partial void OnClubDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club item);
        partial void OnAfterClubDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club> DeleteClub(int id)
        {
            var itemToDelete = Context.Clubs
                              .Where(i => i.Id == id)
                              .Include(i => i.Members)
                              .Include(i => i.Teams)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/equipments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/equipments/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportEquipmentsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/equipments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/equipments/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnEquipmentsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment>> GetEquipments(Query query = null)
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

        partial void OnEquipmentGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment item);
        partial void OnGetEquipmentById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment> GetEquipmentById(int id)
        {
            var items = Context.Equipments
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetEquipmentById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnEquipmentGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnEquipmentCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment item);
        partial void OnAfterEquipmentCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment> CreateEquipment(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment equipment)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment> CancelEquipmentChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnEquipmentUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment item);
        partial void OnAfterEquipmentUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment> UpdateEquipment(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment equipment)
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

        partial void OnEquipmentDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment item);
        partial void OnAfterEquipmentDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment> DeleteEquipment(int id)
        {
            var itemToDelete = Context.Equipments
                              .Where(i => i.Id == id)
                              .Include(i => i.ActivityEquipments)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/members/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/members/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportMembersToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/members/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/members/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnMembersRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member>> GetMembers(Query query = null)
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

        partial void OnMemberGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member item);
        partial void OnGetMemberById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member> GetMemberById(int id)
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

        partial void OnMemberCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member item);
        partial void OnAfterMemberCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member> CreateMember(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member member)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member> CancelMemberChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnMemberUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member item);
        partial void OnAfterMemberUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member> UpdateMember(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member member)
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

        partial void OnMemberDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member item);
        partial void OnAfterMemberDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member> DeleteMember(int id)
        {
            var itemToDelete = Context.Members
                              .Where(i => i.Id == id)
                              .Include(i => i.TeamMembers)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/places/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/places/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportPlacesToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/places/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/places/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnPlacesRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place>> GetPlaces(Query query = null)
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

        partial void OnPlaceGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place item);
        partial void OnGetPlaceById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place> GetPlaceById(int id)
        {
            var items = Context.Places
                              .AsNoTracking()
                              .Where(i => i.Id == id);

 
            OnGetPlaceById(ref items);

            var itemToReturn = items.FirstOrDefault();

            OnPlaceGet(itemToReturn);

            return await Task.FromResult(itemToReturn);
        }

        partial void OnPlaceCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place item);
        partial void OnAfterPlaceCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place> CreatePlace(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place place)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place> CancelPlaceChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnPlaceUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place item);
        partial void OnAfterPlaceUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place> UpdatePlace(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place place)
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

        partial void OnPlaceDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place item);
        partial void OnAfterPlaceDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place> DeletePlace(int id)
        {
            var itemToDelete = Context.Places
                              .Where(i => i.Id == id)
                              .Include(i => i.Appointments)
                              .Include(i => i.Trainings)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/repeatingpatterns/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/repeatingpatterns/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportRepeatingPatternsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/repeatingpatterns/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/repeatingpatterns/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnRepeatingPatternsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern>> GetRepeatingPatterns(Query query = null)
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

        partial void OnRepeatingPatternGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern item);
        partial void OnGetRepeatingPatternById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern> GetRepeatingPatternById(int id)
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

        partial void OnRepeatingPatternCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern item);
        partial void OnAfterRepeatingPatternCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern> CreateRepeatingPattern(FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern repeatingpattern)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern> CancelRepeatingPatternChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnRepeatingPatternUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern item);
        partial void OnAfterRepeatingPatternUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern> UpdateRepeatingPattern(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern repeatingpattern)
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

        partial void OnRepeatingPatternDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern item);
        partial void OnAfterRepeatingPatternDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern> DeleteRepeatingPattern(int id)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/tags/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/tags/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTagsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/tags/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/tags/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTagsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag>> GetTags(Query query = null)
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

        partial void OnTagGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag item);
        partial void OnGetTagById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag> GetTagById(int id)
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

        partial void OnTagCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag item);
        partial void OnAfterTagCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag> CreateTag(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag tag)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag> CancelTagChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTagUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag item);
        partial void OnAfterTagUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag> UpdateTag(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag tag)
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

        partial void OnTagDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag item);
        partial void OnAfterTagDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag> DeleteTag(int id)
        {
            var itemToDelete = Context.Tags
                              .Where(i => i.Id == id)
                              .Include(i => i.ActivityTags)
                              .Include(i => i.Tags1)
                              .Include(i => i.Trainings)
                              .Include(i => i.Trainings1)
                              .Include(i => i.Trainings2)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/teammembers/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/teammembers/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTeamMembersToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/teammembers/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/teammembers/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTeamMembersRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember>> GetTeamMembers(Query query = null)
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

        partial void OnTeamMemberGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember item);
        partial void OnGetTeamMemberById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember> GetTeamMemberById(int id)
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

        partial void OnTeamMemberCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember item);
        partial void OnAfterTeamMemberCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember> CreateTeamMember(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember teammember)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember> CancelTeamMemberChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTeamMemberUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember item);
        partial void OnAfterTeamMemberUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember> UpdateTeamMember(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember teammember)
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

        partial void OnTeamMemberDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember item);
        partial void OnAfterTeamMemberDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember> DeleteTeamMember(int id)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/teams/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/teams/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTeamsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/teams/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/teams/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTeamsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team>> GetTeams(Query query = null)
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

        partial void OnTeamGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team item);
        partial void OnGetTeamById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team> GetTeamById(int id)
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

        partial void OnTeamCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team item);
        partial void OnAfterTeamCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team> CreateTeam(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team team)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team> CancelTeamChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTeamUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team item);
        partial void OnAfterTeamUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team> UpdateTeam(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team team)
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

        partial void OnTeamDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team item);
        partial void OnAfterTeamDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team> DeleteTeam(int id)
        {
            var itemToDelete = Context.Teams
                              .Where(i => i.Id == id)
                              .Include(i => i.Appointments)
                              .Include(i => i.TeamMembers)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/trainingagegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/trainingagegroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTrainingAgeGroupsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/trainingagegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/trainingagegroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTrainingAgeGroupsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup>> GetTrainingAgeGroups(Query query = null)
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

        partial void OnTrainingAgeGroupGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup item);
        partial void OnGetTrainingAgeGroupById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup> GetTrainingAgeGroupById(int id)
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

        partial void OnTrainingAgeGroupCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup item);
        partial void OnAfterTrainingAgeGroupCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup> CreateTrainingAgeGroup(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup trainingagegroup)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup> CancelTrainingAgeGroupChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTrainingAgeGroupUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup item);
        partial void OnAfterTrainingAgeGroupUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup> UpdateTrainingAgeGroup(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup trainingagegroup)
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

        partial void OnTrainingAgeGroupDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup item);
        partial void OnAfterTrainingAgeGroupDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup> DeleteTrainingAgeGroup(int id)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/traininggroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/traininggroups/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTrainingGroupsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/traininggroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/traininggroups/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTrainingGroupsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup>> GetTrainingGroups(Query query = null)
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

        partial void OnTrainingGroupGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup item);
        partial void OnGetTrainingGroupById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup> GetTrainingGroupById(int id)
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

        partial void OnTrainingGroupCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup item);
        partial void OnAfterTrainingGroupCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup> CreateTrainingGroup(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup traininggroup)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup> CancelTrainingGroupChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTrainingGroupUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup item);
        partial void OnAfterTrainingGroupUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup> UpdateTrainingGroup(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup traininggroup)
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

        partial void OnTrainingGroupDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup item);
        partial void OnAfterTrainingGroupDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup> DeleteTrainingGroup(int id)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/trainingparts/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/trainingparts/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTrainingPartsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/trainingparts/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/trainingparts/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTrainingPartsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart>> GetTrainingParts(Query query = null)
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

        partial void OnTrainingPartGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart item);
        partial void OnGetTrainingPartById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart> GetTrainingPartById(int id)
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

        partial void OnTrainingPartCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart item);
        partial void OnAfterTrainingPartCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart> CreateTrainingPart(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart trainingpart)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart> CancelTrainingPartChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTrainingPartUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart item);
        partial void OnAfterTrainingPartUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart> UpdateTrainingPart(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart trainingpart)
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

        partial void OnTrainingPartDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart item);
        partial void OnAfterTrainingPartDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart> DeleteTrainingPart(int id)
        {
            var itemToDelete = Context.TrainingParts
                              .Where(i => i.Id == id)
                              .Include(i => i.TrainingGroups)
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
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/trainings/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/trainings/excel(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        public async Task ExportTrainingsToCSV(Query query = null, string fileName = null)
        {
            navigationManager.NavigateTo(query != null ? query.ToUrl($"export/floorballtrainingidentity/trainings/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')") : $"export/floorballtrainingidentity/trainings/csv(fileName='{(!string.IsNullOrEmpty(fileName) ? UrlEncoder.Default.Encode(fileName) : "Export")}')", true);
        }

        partial void OnTrainingsRead(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training> items);

        public async Task<IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training>> GetTrainings(Query query = null)
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

        partial void OnTrainingGet(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training item);
        partial void OnGetTrainingById(ref IQueryable<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training> items);


        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training> GetTrainingById(int id)
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

        partial void OnTrainingCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training item);
        partial void OnAfterTrainingCreated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training> CreateTraining(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training training)
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

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training> CancelTrainingChanges(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training item)
        {
            var entityToCancel = Context.Entry(item);
            if (entityToCancel.State == EntityState.Modified)
            {
              entityToCancel.CurrentValues.SetValues(entityToCancel.OriginalValues);
              entityToCancel.State = EntityState.Unchanged;
            }

            return item;
        }

        partial void OnTrainingUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training item);
        partial void OnAfterTrainingUpdated(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training> UpdateTraining(int id, FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training training)
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

        partial void OnTrainingDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training item);
        partial void OnAfterTrainingDeleted(FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training item);

        public async Task<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training> DeleteTraining(int id)
        {
            var itemToDelete = Context.Trainings
                              .Where(i => i.Id == id)
                              .Include(i => i.Appointments)
                              .Include(i => i.TrainingAgeGroups)
                              .Include(i => i.TrainingParts)
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