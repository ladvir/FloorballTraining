using FluentValidation;
using Microsoft.AspNetCore.Components.Forms;

namespace FloorballTraining.WebApp.Validations
{

    public class FileForUploadValidator : AbstractValidator<IBrowserFile>
    {
        private readonly List<string> _supportedContentTypes = new()
        {
            @"image/jpeg",
            @"image/jpg",
            @"image/gif",
            @"image/bmp",
            @"image/tif",
            @"image/png",
            @"image/svg+xml"
        };

        public FileForUploadValidator()
        {
            RuleFor(file => file.ContentType)
                .Custom((contentType, context) =>
                {
                    if (!_supportedContentTypes.Contains(contentType))
                    {
                        context.AddFailure("Obsah souboru není podporován");
                    }

                });

            RuleFor(file => file.Size).LessThan(5 * 1024 * 1024)
                .WithMessage("Maximální povolená velikost souboru je 5 MB.");
        }
    }
}
