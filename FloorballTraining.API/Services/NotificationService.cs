using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services
{
    public interface INotificationService
    {
        Task CreateForAdminsAsync(string type, string title, string message);
        Task<List<Notification>> GetForUserAsync(string userId);
        Task<int> GetUnreadCountAsync(string userId);
        Task MarkAsReadAsync(int id, string userId);
        Task MarkAllAsReadAsync(string userId);
    }

    public class NotificationService(
        FloorballTrainingContext context,
        UserManager<AppUser> userManager) : INotificationService
    {
        public async Task CreateForAdminsAsync(string type, string title, string message)
        {
            var admins = await userManager.GetUsersInRoleAsync("Admin");
            var now = DateTime.UtcNow;

            foreach (var admin in admins)
            {
                context.Notifications.Add(new Notification
                {
                    UserId = admin.Id,
                    Type = type,
                    Title = title,
                    Message = message,
                    IsRead = false,
                    CreatedAt = now
                });
            }

            await context.SaveChangesAsync();
        }

        public async Task<List<Notification>> GetForUserAsync(string userId)
        {
            return await context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(100)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task MarkAsReadAsync(int id, string userId)
        {
            var notification = await context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification != null)
            {
                notification.IsRead = true;
                await context.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            await context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        }
    }
}
