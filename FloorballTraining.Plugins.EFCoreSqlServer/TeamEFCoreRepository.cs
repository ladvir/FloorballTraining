﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class TeamEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<Team>(dbContextFactory), ITeamRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;

        public async Task AddTeamAsync(Team team)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var newTeam = team.Clone();

            newTeam.Name = team.Name;

            newTeam.AgeGroup = null;
            newTeam.AgeGroupId = team.AgeGroup!.Id;


            newTeam.Club = null;
            newTeam.ClubId = team.ClubId;

            if (team.Club != null)
            {
                db.Entry(team.Club).State = EntityState.Unchanged;
            }

            db.Teams.Add(newTeam);

            await db.SaveChangesAsync();
        }




        public async Task DeleteTeamAsync(int id)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var team = await db.Teams.FirstOrDefaultAsync(e => e.Id == id);

            if (team != null)
            {
                db.Teams.Remove(team);
                await db.SaveChangesAsync();
            }
        }

        public async Task UpdateTeamAsync(Team team)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingClub = await db.Teams.FirstOrDefaultAsync(e => e.Id == team.Id);


            if (existingClub == null)
            {
                existingClub = team;
            }
            else
            {

                existingClub.Merge(team);
            }


            db.Entry(team.AgeGroup!).State = EntityState.Unchanged;
            team.AgeGroupId = team.AgeGroup!.Id;
            team.AgeGroup = null;

            db.Entry(team.Club!).State = EntityState.Unchanged;
            team.ClubId = team.Club!.Id;
            team.Club = null;

            foreach (var teamMember in existingClub.TeamMembers)
            {

                teamMember.MemberId = teamMember.Member!.Id;
                //teamMember.Member = null;
                db.Entry(teamMember.Member).State = EntityState.Unchanged;
            }

            await db.SaveChangesAsync();
        }

        public async Task<Team?> GetTeamByIdAsync(int teamId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Teams
                .Include(t => t.AgeGroup)
                .Include(t => t.TeamMembers)
                .ThenInclude(tp => tp.Member)
                .Include(t => t.Club)
                .FirstOrDefaultAsync(a => a.Id == teamId);
        }

        public async Task<List<Team>> GetAllTeamsAsync()
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Teams
                .Include(t => t.AgeGroup)
                .Include(t => t.TeamMembers)
                .ThenInclude(tp => tp.Member)
                .Include(t => t.Club)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Team>> GetAllSimpleAsync()
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            return await db.Teams.ToListAsync();
        }
    }
}