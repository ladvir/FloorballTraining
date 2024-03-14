USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_Activities]    Script Date: 14.03.2024 12:44:03 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_Activities]

AS
BEGIN
    SET NOCOUNT ON;

	

    DECLARE 
	@Id INT, 
	@Name NVARCHAR(Max), 
	 @Description NVARCHAR(Max),
      @PersonsMin INT,
      @PersonsMax INT,
	  @GoaliesMin INT,
      @GoaliesMax INT,
      @DurationMin  INT,
      @DurationMax INT,
      @Intensity INT,
      @Difficulty INT,
      @PlaceWidth INT,
      @PlaceLength INT,
      @Environment INT

    DECLARE cur CURSOR for SELECT
            [Id]
			,[Name]
      ,[Description]
      ,[PersonsMin]
      ,[PersonsMax]
	  ,0 as "GoaliesMin"
      ,0 as "GoaliesMax"
      ,[DurationMin]
      ,[DurationMax]
      ,[Intensity]
      ,[Difficulty]
      ,[PlaceWidth]
      ,[PlaceLength]
      ,[Environment]
  FROM [dbo].[Activities];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @Name, @Description, @PersonsMin, @PersonsMax, @GoaliesMin, @GoaliesMax, @DurationMin, @DurationMax, @Intensity, @Difficulty, @PlaceWidth, @PlaceLength, @Environment;
	print 'SET IDENTITY_INSERT [dbo].[Activities] ON;'
	WHILE @@FETCH_STATUS = 0
    BEGIN
		

       Print N' INSERT INTO [dbo].[Activities](
	   [Id]
			,[Name]
           ,[Description]
           ,[PersonsMin]
           ,[PersonsMax]
           ,[GoaliesMin]
           ,[GoaliesMax]
           ,[DurationMin]
           ,[DurationMax]
           ,[Intensity]
           ,[Difficulty]
           ,[PlaceWidth]
           ,[PlaceLength]
           ,[Environment]) VALUES ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ', N''' + @Name + ''''
			+ ', N''' +  @Description + '''' 
			+ ', ' + CAST(@PersonsMin AS NVARCHAR(10))
			+ ', ' + CAST(@PersonsMax AS NVARCHAR(10))
			+ ', ' + CAST(@GoaliesMin AS NVARCHAR(10))
			+ ', ' + CAST(@GoaliesMax AS NVARCHAR(10))
			+ ', ' + CAST(@DurationMin AS NVARCHAR(10))
			+ ', ' + CAST(@DurationMax AS NVARCHAR(10))
			+ ', ' + CAST(@Intensity AS NVARCHAR(10))
			+ ', ' + CAST(@Difficulty AS NVARCHAR(10))
			+ ', ' + CAST(@PlaceWidth AS NVARCHAR(10))
			+ ', ' + CAST(@PlaceLength AS NVARCHAR(10))
			+ ', ' + CAST(@Environment AS NVARCHAR(10))
			+');';		

        FETCH NEXT FROM cur INTO @Id, @Name, @Description, @PersonsMin, @PersonsMax, @GoaliesMin, @GoaliesMax, @DurationMin, @DurationMax, @Intensity, @Difficulty, @PlaceWidth, @PlaceLength, @Environment;
    END;

	print 'SET IDENTITY_INSERT [dbo].[Activities] OFF;'
	   
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

