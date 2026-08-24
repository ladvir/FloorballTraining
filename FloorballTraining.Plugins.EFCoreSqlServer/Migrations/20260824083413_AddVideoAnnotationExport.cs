using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoAnnotationExport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExportError",
                table: "VideoAnnotations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExportStatus",
                table: "VideoAnnotations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ExportedVideoId",
                table: "VideoAnnotations",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_VideoAnnotations_ExportedVideoId",
                table: "VideoAnnotations",
                column: "ExportedVideoId");

            migrationBuilder.AddForeignKey(
                name: "FK_VideoAnnotations_Videos_ExportedVideoId",
                table: "VideoAnnotations",
                column: "ExportedVideoId",
                principalTable: "Videos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VideoAnnotations_Videos_ExportedVideoId",
                table: "VideoAnnotations");

            migrationBuilder.DropIndex(
                name: "IX_VideoAnnotations_ExportedVideoId",
                table: "VideoAnnotations");

            migrationBuilder.DropColumn(
                name: "ExportError",
                table: "VideoAnnotations");

            migrationBuilder.DropColumn(
                name: "ExportStatus",
                table: "VideoAnnotations");

            migrationBuilder.DropColumn(
                name: "ExportedVideoId",
                table: "VideoAnnotations");
        }
    }
}
