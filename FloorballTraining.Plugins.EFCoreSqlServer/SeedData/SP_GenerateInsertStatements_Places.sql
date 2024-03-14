USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_Places]    Script Date: 14.03.2024 12:46:09 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_Places]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	@Name NVARCHAR(Max), 
	 
      @Width INT,
      @Length INT,
      @Environment INT

    DECLARE cur CURSOR for SELECT
            [Id]
			,[Name]
      ,[Width]
      ,[Length]
      ,[Environment]
  FROM [dbo].[Places];
  print 'SET IDENTITY_INSERT [dbo].[Places] ON;';
    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @Name, @Width, @Length, @Environment;
	
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print N' INSERT INTO [dbo].[Places]
           ([Id],[Name]
           ,[Width]
           ,[Length]
           ,[Environment])
     VALUES
          ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ', N''' + @Name + ''''			
			+ ', ' + CAST(@Width AS NVARCHAR(10))
			+ ', ' + CAST(@Length AS NVARCHAR(10))
			+ ', ' + CAST(@Environment AS NVARCHAR(10))
			+');';		

        FETCH NEXT FROM cur INTO @Id, @Name, @Width, @Length, @Environment;
    END;
	     print 'SET IDENTITY_INSERT [dbo].[Places] OFF;';
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

