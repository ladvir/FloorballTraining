namespace FloorballTraining.WebApp.Extensions
{

    public static class DirectoryInfoExtensions
    {
        public static void DeepCopy(this DirectoryInfo directory, string destinationDir)
        {
            foreach (string dir in Directory.GetDirectories(directory.FullName, "*", SearchOption.AllDirectories))
            {
                string dirToCreate = dir.Replace(directory.FullName, destinationDir);
                Directory.CreateDirectory(dirToCreate);
            }

            foreach (string fileForCopy in Directory.GetFiles(directory.FullName, "*.*", SearchOption.AllDirectories))
            {
                var file = new FileInfo(fileForCopy);

                string? dirToCreate = file.Directory?.FullName.Replace(file.Directory.Name, destinationDir);

                if (dirToCreate == null) continue;

                if (!Directory.Exists(dirToCreate))
                {
                    Directory.CreateDirectory(dirToCreate);
                }

                File.Copy(fileForCopy, Path.Combine(dirToCreate, file.Name), true);
            }
        }
    }
}
