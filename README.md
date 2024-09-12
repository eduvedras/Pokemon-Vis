# Pokemon-Vis

This project is a visualization tool designed to explore and perform complex searches of the Pokémon Trading Card Game (TCG). With the help of three distinct charts, users can analyze the vast collection of Pokémon cards and uncover insights that assist in creating powerful decks. Whether you're searching for specific card attributes, comparing strengths and weaknesses, or identifying synergies, this tool offers a visual approach to Pokémon TCG data exploration.

## Motivation

This project was developed as part of the Information and Visualization course. We chose the Pokémon TCG as our theme because of our fond memories playing the game as children. Like many others, we were fascinated by the endless possibilities of building decks and strategizing to create the most effective combinations of cards. As passionate players, we wanted to create a tool that could help both novice and experienced players search, filter, and discover the best cards for their decks in a more interactive and insightful way. By using this visualization tool, we hope to bring the same excitement and strategy we enjoyed in our youth to new and returning players.

## Features & Charts

The project consists of three interactive visualizations (idioms) and a search bar. The search bar is located on the left side of the screen, while the visualizations are arranged as follows: the first idiom, a boxplot, is on the right of the search bar, the second idiom (parallel coordinates) is placed beneath the boxplot, and the third idiom (parallel sets) is positioned on the far right.

### 1. Boxplot
The first idiom is a **boxplot** with two axes: **HP** and **Type**. This chart allows users to:

- Identify **outliers** for each Pokémon type.
- View the **median HP** of each type.
- **Select individual boxplots** to filter the other two charts (parallel coordinates and parallel sets) based on the chosen type.

Additionally, a line across the boxplots shows the **average HP** across all types, giving a quick reference for comparisons.

### 2. Parallel Coordinates
The second idiom is a **parallel coordinates** plot representing four attributes: **HP, Damage, Energy Cost,** and **Level**. In this visualization:

- Users can apply a **brush** to select specific intervals within each attribute, filtering the other idioms based on the selected data.
- If the number of displayed lines is 200 or fewer, users can identify the **Pokémon name** corresponding to each line, enabling precise exploration.

### 3. Parallel Sets
The third idiom is the **parallel sets** plot, visualizing five attributes: **Types, Weakness, Resistance, Evolution,** and **Rarity**. This chart enables users to:

- **Reorder** attributes or categories for flexible data exploration.
- **Select two different flow lines**, which will be highlighted with distinct colors in the parallel coordinates, allowing users to compare Pokémon based on selected attributes and update the boxplot with the relevant data.

For a more detailed explanation, refer to the report: [Report.pdf](VI-25_Report.pdf).

