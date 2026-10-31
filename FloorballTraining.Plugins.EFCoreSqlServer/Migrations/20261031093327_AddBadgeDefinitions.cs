using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddBadgeDefinitions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MemberBadges_MemberId_Code_SeasonId",
                table: "MemberBadges");

            // Code: int enum value -> badge name. Mapped by enum NAME so no numeric id is assumed.
            migrationBuilder.AddColumn<string>(name: "CodeName", table: "MemberBadges", type: "nvarchar(64)", nullable: true);
            foreach (var code in Enum.GetValues<FloorballTraining.CoreBusiness.Enums.BadgeCode>())
                migrationBuilder.Sql($"UPDATE MemberBadges SET CodeName = N'{code}' WHERE Code = {(int)code}");
            migrationBuilder.Sql("DELETE FROM MemberBadges WHERE CodeName IS NULL");
            migrationBuilder.DropColumn(name: "Code", table: "MemberBadges");
            migrationBuilder.RenameColumn(name: "CodeName", table: "MemberBadges", newName: "Code");
            migrationBuilder.AlterColumn<string>(name: "Code", table: "MemberBadges", type: "nvarchar(64)", maxLength: 64, nullable: false, defaultValue: "", oldClrType: typeof(string), oldType: "nvarchar(64)", oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PeriodKey",
                table: "MemberBadges",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BadgeDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Metric = table.Column<int>(type: "int", nullable: false),
                    Threshold = table.Column<int>(type: "int", nullable: false),
                    Period = table.Column<int>(type: "int", nullable: false),
                    Repeatable = table.Column<bool>(type: "bit", nullable: false),
                    IconPath = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BadgeDefinitions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemberBadges_MemberId_Code_SeasonId_PeriodKey",
                table: "MemberBadges",
                columns: new[] { "MemberId", "Code", "SeasonId", "PeriodKey" },
                unique: true,
                filter: "[SeasonId] IS NOT NULL AND [PeriodKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_BadgeDefinitions_Code",
                table: "BadgeDefinitions",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BadgeDefinitions");

            migrationBuilder.DropIndex(
                name: "IX_MemberBadges_MemberId_Code_SeasonId_PeriodKey",
                table: "MemberBadges");

            migrationBuilder.DropColumn(
                name: "PeriodKey",
                table: "MemberBadges");

            migrationBuilder.AddColumn<int>(name: "CodeInt", table: "MemberBadges", type: "int", nullable: true);
            foreach (var code in Enum.GetValues<FloorballTraining.CoreBusiness.Enums.BadgeCode>())
                migrationBuilder.Sql($"UPDATE MemberBadges SET CodeInt = {(int)code} WHERE Code = N'{code}'");
            migrationBuilder.Sql("DELETE FROM MemberBadges WHERE CodeInt IS NULL"); // custom badges have no enum value
            migrationBuilder.DropColumn(name: "Code", table: "MemberBadges");
            migrationBuilder.RenameColumn(name: "CodeInt", table: "MemberBadges", newName: "Code");
            migrationBuilder.AlterColumn<int>(name: "Code", table: "MemberBadges", type: "int", nullable: false, defaultValue: 0, oldClrType: typeof(int), oldType: "int", oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberBadges_MemberId_Code_SeasonId",
                table: "MemberBadges",
                columns: new[] { "MemberId", "Code", "SeasonId" },
                unique: true,
                filter: "[SeasonId] IS NOT NULL");
        }
    }
}
