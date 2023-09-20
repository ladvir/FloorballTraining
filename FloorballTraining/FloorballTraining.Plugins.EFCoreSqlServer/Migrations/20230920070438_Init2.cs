using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class Init2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ActivityTags",
                table: "ActivityTags");

            migrationBuilder.AddColumn<int>(
                name: "ActivityTagId",
                table: "ActivityTags",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_ActivityTags_ActivityTagId_ActivityId_TagId",
                table: "ActivityTags",
                columns: new[] { "ActivityTagId", "ActivityId", "TagId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_ActivityTags",
                table: "ActivityTags",
                column: "ActivityTagId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityTags_ActivityId",
                table: "ActivityTags",
                column: "ActivityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropUniqueConstraint(
                name: "AK_ActivityTags_ActivityTagId_ActivityId_TagId",
                table: "ActivityTags");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ActivityTags",
                table: "ActivityTags");

            migrationBuilder.DropIndex(
                name: "IX_ActivityTags_ActivityId",
                table: "ActivityTags");

            migrationBuilder.DropColumn(
                name: "ActivityTagId",
                table: "ActivityTags");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ActivityTags",
                table: "ActivityTags",
                columns: new[] { "ActivityId", "TagId" });
        }
    }
}
