<template>
	<div>
		<div id="graph_plot">
			<div id="legend"></div>
			<div v-if="isLoading">
				<h1>Loading Graph...</h1>
			</div>
			<div id="ResourcesTree"></div>
		</div>
	</div>
</template>

<script>
import * as d3 from "d3";
import { defineComponent } from "vue";
import Api from "../api";

export default defineComponent({
	data() {
		return {
			isLoading: true,
			Colours: {
				RESOURCE_COLLECTION_ROOT: "blue",
				RESOURCE_COLLECTION: "navy",
				RESOURCE_COLLECTION_TOPIC_BUNDLE: "lightskyblue",
				RESOURCE_COLLECTION_SMART_QUIZ: "red",
				DOCUMENT_INTERNAL: "palegreen",
				DOCUMENT_EXTERNAL: "darkgreen",
				URL: "darkmagenta",
				VIDEO_INTERNAL: "darkgrey",
				VIDEO_EXTERNAL: "grey",
				VIDEO_EXTERNAL_KALTURA: "gainsboro",
				RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL: "khaki",
				SERVICE_EXTERNAL_LTI: "lightpink",
				QUIZ_UQ_CHEM: "orange",
				QUIZ_QUESTION: "yellow",
			},
		};
	},

	mounted() {
		this.generateLegend();
		this.generatePlot();
	},

	methods: {
		/**
		 * This method creates the Graph legend on the tree graph via D3
		 */
		generateLegend() {
			const legend = d3.select("#legend");
			const legendbox = legend
				.append("svg")
				.attr("width", 1200)
				.attr("height", 250);

			const circleXPositions = [100, 400, 700, 1000];
			const legendData = [
				{
					label: "Collection root",
					colorIndex: "RESOURCE_COLLECTION_ROOT"
				},
				{ label: "Collection", colorIndex: "RESOURCE_COLLECTION" },
				{
					label: "Collection topic bundle",
					colorIndex: "RESOURCE_COLLECTION_TOPIC_BUNDLE"
				},
				{
					label: "Smart Quiz",
					colorIndex: "RESOURCE_COLLECTION_SMART_QUIZ"
				},
				{ label: "Document internal", colorIndex: "DOCUMENT_INTERNAL" },
				{ label: "Document external", colorIndex: "DOCUMENT_EXTERNAL" },
				{ label: "URL", colorIndex: "VIDEO_EXTERNAL_KALTURA" },
				{ label: "Video internal", colorIndex: "VIDEO_INTERNAL" },
				{ label: "Video external", colorIndex: "VIDEO_EXTERNAL" },
				{
					label: "Video external kaltura",
					colorIndex: "VIDEO_EXTERNAL_KALTURA"
				},
				{
					label: "Inline document internal",
					colorIndex: "RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL"
				},
				{
					label: "Service external LTI",
					colorIndex: "SERVICE_EXTERNAL_LTI"
				},
				{ label: "Quiz", colorIndex: "QUIZ_UQ_CHEM" },
				{ label: "Quiz question", colorIndex: "QUIZ_QUESTION" },
			];

			for (const [index, data] of legendData.entries()) {
				legendbox
					.append("circle")
					.attr("cx", circleXPositions[Math.floor(index / 4)])
					.attr("cy", 130 + (index % 4) * 30)
					.attr("r", 6)
					.style("fill", this.Colours[data.colorIndex]);

				legendbox
					.append("text")
					.attr("x", circleXPositions[Math.floor(index / 4)] + 20)
					.attr("y", 130 + (index % 4) * 30)
					.text(data.label)
					.style("font-size", "15px")
					.attr("alignment-baseline", "middle");
			}
		},

		/**
		 * This method creates the nodes on the tree graph via D3
		 */
		async generatePlot() {
			try {
				const response = await Api.Resource.getGraph();
				const treeData = response.data[0];

				// set the dimensions and margins of the diagram
				const margin = { top: 20, right: 90, bottom: 30, left: 120 },
					// manaually adjust graph size to make labels readable
					width = 4000 - margin.left - margin.right,
					height = 30000 - margin.top - margin.bottom;

				// declares a tree layout and assigns the size
				const treemap = d3
					.tree()
					.size([height, width])
					.separation(
						(a, b) => (a.parent == b.parent ? 1 : 2) / a.depth
					);

				// assigns the data to a hierarchy using parent-child relationships
				const nodes = d3.hierarchy(treeData, (d) => d.children);

				// maps the node data to the tree layout
				const treeNodes = treemap(nodes);

				// append the svg object to the body of the page
				// appends a 'group' element to 'svg'
				// moves the 'group' element to the top left margin
				const svg = d3
					.select("#" + "ResourcesTree")
					.append("svg")
					.attr("id", "graph")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom);

				const g = svg
					.append("g")
					.attr("id", "g")
					.attr(
						"transform",
						"translate(" + margin.left + "," + margin.top + ")"
					);

				// adds the links between the treeNodes
				g.selectAll(".link")
					.data(treeNodes.descendants().slice(1))
					.enter()
					.append("path")
					.attr("class", "link")
					.style("stroke", (d) => d.data.type)
					.attr("d", (d) => {
						return (
							"M" +
							d.y +
							"," +
							d.x +
							"C" +
							(d.y + d.parent.y) / 2 +
							"," +
							d.x +
							" " +
							(d.y + d.parent.y) / 2 +
							"," +
							d.parent.x +
							" " +
							d.parent.y +
							"," +
							d.parent.x
						);
					});

				// adds each node as a group
				const node = g
					.selectAll(".node")
					.data(treeNodes.descendants())
					.enter()
					.append("g")
					.attr(
						"class",
						(d) =>
							"node" +
							(d.children ? " node--internal" : " node--leaf")
					)
					.attr(
						"transform",
						(d) => "translate(" + d.y + "," + d.x + ")"
					);

				// adds the circle to the node
				node.append("circle")
					.attr("r", 3)
					.style("stroke", (d) => this.Colours[d.data.type])
					.style("fill", (d) => this.Colours[d.data.type]);

				// adds the text to the node
				node.append("text")
					.attr("dy", ".35em")
					.attr("x", (d) =>
						d.children
							? ((d.data.value || 0) + 10) * 1
							: (d.data.value || 0) + 5
					)
					.attr("y", (d) =>
						d.children && d.depth !== 0
							? -((d.data.value || 0) + 5)
							: 0
					)
					.style("text-anchor", (d) => (d.children ? "end" : "start"))
					.text((d) => d.data.label);

				this.isLoading = false; // remove Loading Graph text
			} catch (error) {
				alert(`Something went wrong: ${error}`);
				console.error("Error fetching plot data:", error);
			}
		},
	},
});
</script>

<style>
.node circle {
	fill: #fff;
	stroke: steelblue;
	stroke-width: 3px;
}

.node text {
	font: 12px sans-serif;
}

.link {
	fill: none;
	stroke: #ccc;
	stroke-width: 2px;
}
</style>
