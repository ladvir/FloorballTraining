USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_Trainings]    Script Date: 14.03.2024 12:47:16 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_Trainings]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	@Name NVARCHAR(Max), 
	 @Description NVARCHAR(Max),
      @Duration int,           
@PersonsMin int,         
@PersonsMax int,         
@Intensity int,          
@Difficulty int,         
@CommentBefore NVARCHAR(Max),      
@CommentAfter NVARCHAR(Max),       
@PlaceId  int,            
@TrainingGoal1Id int,    
@TrainingGoal2Id int,    
@TrainingGoal3Id int    

    DECLARE cur CURSOR for SELECT
            [Id]
			,[Name]
      ,[Description]
       ,[Duration]
      ,[PersonsMin]
      ,[PersonsMax]
      ,[Intensity]
      ,[Difficulty]
      ,[CommentBefore]
      ,[CommentAfter]
      ,[PlaceId]
      ,[TrainingGoal1Id]
      ,[TrainingGoal2Id]
      ,[TrainingGoal3Id]
  FROM [dbo].[Trainings];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @Name, @Description, @Duration, @PersonsMin, @PersonsMax, @Intensity, @Difficulty, @CommentBefore, @CommentAfter, @PlaceId, @TrainingGoal1Id, @TrainingGoal2Id, @TrainingGoal3Id;
	 print 'SET IDENTITY_INSERT [dbo].[Trainings] ON;';
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print N'INSERT INTO [dbo].[Trainings]
           ([Id],[Name]
           ,[Description]
           ,[Duration]
           ,[PersonsMin]
           ,[PersonsMax]
           ,[Intensity]
           ,[Difficulty]
           ,[CommentBefore]
           ,[CommentAfter]
           ,[PlaceId]
           ,[TrainingGoal1Id]
           ,[TrainingGoal2Id]
           ,[TrainingGoal3Id])
      VALUES ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ', N''' + @Name + ''''
			+ ', ' + CASE ISNULL( @Description, '') WHEN '' then 'null' else N'''' +  @Description + '''' end 
			+ ', ' + CAST(@Duration AS NVARCHAR(10))
			+ ', ' + CAST(@PersonsMin AS NVARCHAR(10))
			+ ', ' + CAST(@PersonsMax AS NVARCHAR(10))
			+ ', ' + CAST(@Intensity AS NVARCHAR(10))
			+ ', ' + CAST(@Difficulty AS NVARCHAR(10))
			+ ', ' + CASE ISNULL( @CommentBefore, '') WHEN '' then 'null' else N'''' +  @CommentBefore + '''' end 
			+ ', ' + CASE ISNULL( @CommentAfter, '') WHEN '' then 'null' else N'''' +  @CommentAfter + '''' end 
			+ ', ' + CAST(@PlaceId AS NVARCHAR(10))
			+ ', ' + CAST(@TrainingGoal1Id AS NVARCHAR(10))
			+ ', ' + CASE ISNULL(CAST(@TrainingGoal2Id AS NVARCHAR(10)), '') WHEN '' then 'null' else '''' +  CAST(@TrainingGoal2Id AS NVARCHAR(10)) + '''' end 
			+ ', ' + CASE ISNULL(CAST(@TrainingGoal3Id AS NVARCHAR(10)), '') WHEN '' then 'null' else '''' +  CAST(@TrainingGoal3Id AS NVARCHAR(10)) + '''' end 
			+');';		

        FETCH NEXT FROM cur INTO @Id, @Name, @Description, @Duration, @PersonsMin, @PersonsMax, @Intensity, @Difficulty, @CommentBefore, @CommentAfter, @PlaceId, @TrainingGoal1Id, @TrainingGoal2Id, @TrainingGoal3Id;
    END;
	    print 'SET IDENTITY_INSERT [dbo].[Trainings] OFF;';
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

