USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_Tags]    Script Date: 14.03.2024 12:46:25 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_Tags]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @InsertStatements NVARCHAR(MAX) = N''; 

    DECLARE 
	@Id INT, 
	@Name NVARCHAR(Max), 
	@Color NVARCHAR(Max),
	@ParentTagId INT, 
	@IsTrainingGoal bit;

    DECLARE cur CURSOR for SELECT
            [Id]
      ,[Name]
      ,[Color]
      ,[ParentTagId]
      ,[IsTrainingGoal]
  FROM [dbo].[Tags];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @Name, @Color, @ParentTagId, @IsTrainingGoal;
		print 'SET IDENTITY_INSERT [dbo].[Tags] ON;';
	WHILE @@FETCH_STATUS = 0
    BEGIN
  
			Print  N' INSERT INTO [dbo].[Tags]
           ([Id],[Name]
           ,[Color]
           ,[ParentTagId]
           ,[IsTrainingGoal])
     VALUES (' 
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ', N''' + @Name + ''''
			+ ', ''' + @Color + ''''
			+ ', ' + ISNULL(CAST(@ParentTagId as nvarchar(100)),'null')
			+ ', '+ CAST(@IsTrainingGoal as nvarchar(10)) + 
			+');';

        FETCH NEXT FROM cur INTO @Id, @Name, @Color, @ParentTagId, @IsTrainingGoal;
    END;
	   print 'SET IDENTITY_INSERT [dbo].[Tags] OFF;';
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

